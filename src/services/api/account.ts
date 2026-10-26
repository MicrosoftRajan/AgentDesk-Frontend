import { apiRequest } from "./client";

export type UserRole = "staff" | "patient";

/** Who the signed-in user is and what they may see. */
export interface MeResponse {
  id: string;
  email: string | null;
  role: UserRole;
  fullName: string | null;
  phone: string | null;
}

export function getMe(options?: { signal?: AbortSignal }): Promise<MeResponse> {
  return apiRequest<MeResponse>("/api/v1/me", { signal: options?.signal });
}
