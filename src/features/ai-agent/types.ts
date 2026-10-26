export const AGENT_RUN_STATUSES = [
  "idle",
  "pending",
  "running",
  "awaiting_approval",
  "completed",
  "failed",
  "cancelled",
] as const;

export type AgentRunStatus = (typeof AGENT_RUN_STATUSES)[number];

export const AGENT_STEP_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
  "skipped",
] as const;

export type AgentStepStatus = (typeof AGENT_STEP_STATUSES)[number];

export interface AgentStep {
  id: string;
  label: string;
  status: AgentStepStatus;
}

export interface AgentRun {
  id: string;
  goal: string;
  status: Exclude<AgentRunStatus, "idle">;
  steps: AgentStep[];
  result: string | null;
  errorMessage: string | null;
}
