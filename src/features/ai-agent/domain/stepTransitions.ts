import type { AgentStep, AgentStepStatus } from "../types";

export function createPendingSteps(
  definitions: ReadonlyArray<Pick<AgentStep, "id" | "label">>,
): AgentStep[] {
  return definitions.map((step) => ({
    id: step.id,
    label: step.label,
    status: "pending",
  }));
}

export function withStepStatus(
  steps: readonly AgentStep[],
  index: number,
  status: AgentStepStatus,
): AgentStep[] {
  return steps.map((step, stepIndex) =>
    stepIndex === index ? { ...step, status } : step,
  );
}

/** Close every step that has not finished. Used when a run stops early. */
export function skipUnfinishedSteps(steps: readonly AgentStep[]): AgentStep[] {
  return steps.map((step) =>
    step.status === "pending" || step.status === "running"
      ? { ...step, status: "skipped" }
      : step,
  );
}

/** Mark the active step failed and skip anything still waiting. */
export function failActiveStep(steps: readonly AgentStep[]): AgentStep[] {
  let markedFailure = false;

  return steps.map((step) => {
    if (markedFailure) {
      return step.status === "pending" ? { ...step, status: "skipped" } : step;
    }

    if (step.status === "running" || step.status === "pending") {
      markedFailure = true;
      return { ...step, status: "failed" };
    }

    return step;
  });
}
