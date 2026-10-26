import { apiRequest } from "./client";

export interface CreateAgentRunRequest {
  goal: string;
}

export type AgentRunApiStatus =
  | "pending"
  | "running"
  | "awaiting_approval"
  | "completed"
  | "failed"
  | "cancelled";

export type ToolRiskLevel = "low" | "medium" | "high";

export type ApprovalApiStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired";

/** An action the agent wants to take and needs the user's OK for. */
export interface ApprovalRequestResponse {
  id: string;
  runId: string;
  toolName: string;
  toolInput: unknown;
  riskLevel: ToolRiskLevel;
  status: ApprovalApiStatus;
  createdAt: string;
  expiresAt: string;
  resolvedAt: string | null;
  /** Plain-language description of the action, when the server has one. */
  summary?: ApprovalSummaryResponse | null;
}

export interface ApprovalSummaryResponse {
  title: string;
  lines: { label: string; value: string }[];
}

export interface AgentRunResponse {
  id: string;
  goal: string;
  status: AgentRunApiStatus;
  createdAt: string;
  response?: string | null;
  completedAt?: string | null;
  /** Set while status is "awaiting_approval". */
  pendingApproval?: ApprovalRequestResponse | null;
}

export type AgentMessageRole = "user" | "assistant" | "tool" | "system";

export interface AgentMessageResponse {
  id: string;
  role: AgentMessageRole;
  content: string;
  createdAt: string;
}

export interface AgentRunDetailsResponse extends AgentRunResponse {
  messages: AgentMessageResponse[];
}

export async function createAgentRun(
  request: CreateAgentRunRequest,
  options?: { signal?: AbortSignal },
): Promise<AgentRunResponse> {
  return apiRequest<AgentRunResponse>("/api/v1/agents/runs", {
    method: "POST",
    body: JSON.stringify(request),
    signal: options?.signal,
  });
}

export async function getAgentRuns(
  options?: { signal?: AbortSignal },
): Promise<AgentRunResponse[]> {
  return apiRequest<AgentRunResponse[]>("/api/v1/agents/runs", {
    signal: options?.signal,
  });
}

export async function getAgentRun(
  runId: string,
  options?: { signal?: AbortSignal },
): Promise<AgentRunDetailsResponse> {
  return apiRequest<AgentRunDetailsResponse>(
    `/api/v1/agents/runs/${encodeURIComponent(runId)}`,
    { signal: options?.signal },
  );
}

async function decideAgentRun(
  runId: string,
  decision: "approve" | "reject",
  options?: { signal?: AbortSignal },
): Promise<AgentRunResponse> {
  return apiRequest<AgentRunResponse>(
    `/api/v1/agents/runs/${encodeURIComponent(runId)}/${decision}`,
    { method: "POST", signal: options?.signal },
  );
}

export function approveAgentRun(
  runId: string,
  options?: { signal?: AbortSignal },
): Promise<AgentRunResponse> {
  return decideAgentRun(runId, "approve", options);
}

export function rejectAgentRun(
  runId: string,
  options?: { signal?: AbortSignal },
): Promise<AgentRunResponse> {
  return decideAgentRun(runId, "reject", options);
}
