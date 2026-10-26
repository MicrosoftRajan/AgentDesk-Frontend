import { useCallback, useEffect, useRef, useState } from "react";

import {
  approveAgentRun,
  createAgentRun,
  getAgentRun,
  rejectAgentRun,
  type AgentRunResponse,
  type ApprovalRequestResponse,
} from "../../../services/api/agents";
import { createPendingSteps, skipUnfinishedSteps } from "../domain/stepTransitions";
import { validateGoal } from "../domain/validateGoal";
import type { AgentRunStatus, AgentStep } from "../types";

const EXECUTION_STEPS = [
  { id: "understand", label: "Understand the goal" },
  { id: "plan", label: "Build a task plan" },
  { id: "execute", label: "Execute the plan" },
  { id: "result", label: "Prepare the result" },
] as const;

const SAFE_FAILURE_MESSAGE = "The agent run failed. Try again.";
const NOT_APPROVED_MESSAGE =
  "The action was not approved, so nothing was executed.";

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function startSteps(): AgentStep[] {
  return createPendingSteps(EXECUTION_STEPS).map((step, index) => ({
    ...step,
    status: index === 0 ? "running" : "pending",
  }));
}

export function useAgent() {
  const [goal, setGoal] = useState("");
  const [status, setStatus] = useState<AgentRunStatus>("idle");
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [approval, setApproval] = useState<ApprovalRequestResponse | null>(
    null,
  );
  const [isDeciding, setIsDeciding] = useState(false);

  const approvalRef = useRef<ApprovalRequestResponse | null>(null);
  approvalRef.current = approval;
  const decidingRef = useRef(false);

  const abortRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);
  const inFlightRef = useRef(false);
  const statusRef = useRef<AgentRunStatus>("idle");
  statusRef.current = status;

  useEffect(() => {
    return () => {
      generationRef.current += 1;
      abortRef.current?.abort();
    };
  }, []);

  const validation = validateGoal(goal);
  const isRunning = status === "pending" || status === "running";
  const isAwaitingApproval = status === "awaiting_approval" && approval !== null;
  const canRun = validation.ok && !isRunning && !isAwaitingApproval;
  const goalMessage =
    goal.trim().length > 0 && !validation.ok ? validation.message : null;

  const updateGoal = useCallback((value: string) => {
    setGoal(value);

    if (inFlightRef.current || statusRef.current === "idle") {
      return;
    }

    statusRef.current = "idle";
    setStatus("idle");
    setSteps([]);
    setResult(null);
    setErrorMessage(null);
    setApproval(null);
  }, []);

  /** Mirrors a run returned by the API into the screen state. */
  const applyRun = useCallback((run: AgentRunResponse) => {
    switch (run.status) {
      case "awaiting_approval":
        setApproval(run.pendingApproval ?? null);
        setResult(null);
        setErrorMessage(null);
        setStatus("awaiting_approval");
        return;

      case "completed":
        setApproval(null);
        setSteps((currentSteps) =>
          currentSteps.map((step) => ({ ...step, status: "completed" })),
        );
        setResult(run.response ?? null);
        setErrorMessage(null);
        setStatus("completed");
        return;

      case "cancelled":
        setApproval(null);
        setSteps((currentSteps) => skipUnfinishedSteps(currentSteps));
        setResult(null);
        setErrorMessage(NOT_APPROVED_MESSAGE);
        setStatus("cancelled");
        return;

      case "failed":
        setApproval(null);
        setSteps((currentSteps) =>
          currentSteps.map((step) => ({ ...step, status: "failed" })),
        );
        setResult(null);
        setErrorMessage(SAFE_FAILURE_MESSAGE);
        setStatus("failed");
        return;

      default:
        return;
    }
  }, []);

  const runAgent = useCallback(async () => {
    const parsed = validateGoal(goal);

    if (!parsed.ok || inFlightRef.current || statusRef.current === "running") {
      return;
    }

    inFlightRef.current = true;
    const generation = generationRef.current + 1;
    generationRef.current = generation;

    const controller = new AbortController();
    abortRef.current = controller;

    const isCurrent = () => generationRef.current === generation;

    setStatus("pending");
    setSteps(startSteps());
    setResult(null);
    setErrorMessage(null);
    setApproval(null);

    try {
      const agentRun = await createAgentRun(
        { goal: parsed.goal },
        { signal: controller.signal },
      );

      if (!isCurrent()) {
        return;
      }

      applyRun(agentRun);
    } catch (error) {
      if (!isCurrent()) {
        return;
      }

      if (isAbortError(error)) {
        setSteps((currentSteps) => skipUnfinishedSteps(currentSteps));
        setResult(null);
        setErrorMessage(null);
        setStatus("cancelled");
        return;
      }

      const message =
        error instanceof Error && error.message.length > 0
          ? error.message
          : SAFE_FAILURE_MESSAGE;

      console.log("Failed to create agent run:", message);

      setStatus("failed");
      setSteps((currentSteps) =>
        currentSteps.map((step) => ({
          ...step,
          status: "failed",
        })),
      );
      setResult(null);
      setErrorMessage(message);
    } finally {
      inFlightRef.current = false;
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [goal, applyRun]);

  /**
   * Sends the user's decision. Only the user can approve: the agent has
   * no code path that resolves an approval.
   */
  const decide = useCallback(
    async (decision: "approve" | "reject") => {
      const current = approvalRef.current;

      if (!current || decidingRef.current) {
        return;
      }

      decidingRef.current = true;
      setIsDeciding(true);
      setErrorMessage(null);

      const generation = generationRef.current;
      const isCurrent = () => generationRef.current === generation;

      if (decision === "approve") {
        // The agent resumes on the server; show it as running meanwhile.
        setApproval(null);
        setStatus("running");
      }

      try {
        const run =
          decision === "approve"
            ? await approveAgentRun(current.runId)
            : await rejectAgentRun(current.runId);

        if (isCurrent()) {
          applyRun(run);
        }
      } catch (error) {
        if (!isCurrent()) {
          return;
        }

        const message =
          error instanceof Error && error.message.length > 0
            ? error.message
            : SAFE_FAILURE_MESSAGE;

        console.log(`Failed to ${decision} agent run:`, message);

        // The request may have expired or been resolved elsewhere:
        // re-read the real state instead of guessing.
        try {
          const latest = await getAgentRun(current.runId);

          if (isCurrent()) {
            applyRun(latest);
            setErrorMessage(message);
          }
        } catch {
          if (isCurrent()) {
            setApproval(current);
            setStatus("awaiting_approval");
            setErrorMessage(message);
          }
        }
      } finally {
        decidingRef.current = false;

        if (isCurrent()) {
          setIsDeciding(false);
        }
      }
    },
    [applyRun],
  );

  const approve = useCallback(() => decide("approve"), [decide]);
  const reject = useCallback(() => decide("reject"), [decide]);

  const cancelAgent = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      return;
    }

    if (statusRef.current !== "running") {
      return;
    }

    generationRef.current += 1;
    statusRef.current = "cancelled";
    setStatus("cancelled");
    setSteps((currentSteps) => skipUnfinishedSteps(currentSteps));
    setResult(null);
  }, []);

  return {
    goal,
    setGoal: updateGoal,
    status,
    steps,
    result,
    errorMessage,
    goalMessage,
    canRun,
    isRunning,
    approval,
    isAwaitingApproval,
    isDeciding,
    approve,
    reject,
    runAgent,
    cancelAgent,
  };
}
