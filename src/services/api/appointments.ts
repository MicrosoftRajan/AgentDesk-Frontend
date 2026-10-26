import { apiRequest } from "./client";

export type AppointmentApiStatus =
  | "scheduled"
  | "cancelled"
  | "completed"
  | "no_show";

export interface AppointmentResponse {
  id: string;
  patientName: string;
  patientPhone: string;
  reason: string | null;
  /** ISO timestamp (UTC). */
  scheduledAt: string;
  status: AppointmentApiStatus;
  cancelReason: string | null;
  lastReminderAt: string | null;
}

export interface AppointmentDayResponse {
  /** Clinic day, YYYY-MM-DD (IST). */
  date: string;
  appointments: AppointmentResponse[];
}

export function getAppointments(
  date: string,
  options?: { signal?: AbortSignal },
): Promise<AppointmentDayResponse> {
  return apiRequest<AppointmentDayResponse>(
    `/api/v1/appointments?date=${encodeURIComponent(date)}`,
    { signal: options?.signal },
  );
}
