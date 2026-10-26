import type { MeResponse } from "./account";
import { apiRequest } from "./client";

export type PatientAppointmentStatus =
  | "scheduled"
  | "cancelled"
  | "completed"
  | "no_show";

export interface PatientAppointment {
  id: string;
  reason: string | null;
  /** ISO timestamp (UTC). */
  scheduledAt: string;
  status: PatientAppointmentStatus;
  cancelReason: string | null;
}

export interface SlotsResponse {
  /** Clinic day, YYYY-MM-DD (IST). */
  date: string;
  /** False on days the clinic is closed. */
  isOpen: boolean;
  slots: { startsAt: string }[];
}

export function updatePatientProfile(details: {
  fullName: string;
  phone: string;
}): Promise<MeResponse> {
  return apiRequest<MeResponse>("/api/v1/patient/profile", {
    method: "PUT",
    body: JSON.stringify(details),
  });
}

export function getSlots(
  date: string,
  options?: { signal?: AbortSignal },
): Promise<SlotsResponse> {
  return apiRequest<SlotsResponse>(
    `/api/v1/patient/slots?date=${encodeURIComponent(date)}`,
    { signal: options?.signal },
  );
}

export async function getMyAppointments(options?: {
  signal?: AbortSignal;
}): Promise<PatientAppointment[]> {
  const data = await apiRequest<{ appointments: PatientAppointment[] }>(
    "/api/v1/patient/appointments",
    { signal: options?.signal },
  );

  return data.appointments;
}

export async function bookAppointment(input: {
  scheduledAt: string;
  reason?: string;
}): Promise<PatientAppointment> {
  const data = await apiRequest<{ appointment: PatientAppointment }>(
    "/api/v1/patient/appointments",
    { method: "POST", body: JSON.stringify(input) },
  );

  return data.appointment;
}

export async function cancelMyAppointment(
  id: string,
): Promise<PatientAppointment> {
  const data = await apiRequest<{ appointment: PatientAppointment }>(
    `/api/v1/patient/appointments/${encodeURIComponent(id)}/cancel`,
    { method: "POST" },
  );

  return data.appointment;
}
