import type { AppointmentStatus } from "./types";

/**
 * Allowed lifecycle moves. Reschedule is not a status.
 * scheduled → pending happens only when a reschedule clears the doctor,
 * and that path lives in operations.ts rather than as a button transition.
 */
const TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ["scheduled", "canceled"],
  scheduled: ["in_progress", "canceled", "incomplete"],
  in_progress: ["completed"],
  completed: [],
  canceled: [],
  incomplete: [],
};

export function canTransition(
  from: AppointmentStatus,
  to: AppointmentStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function isTerminal(status: AppointmentStatus): boolean {
  return status === "completed" || status === "canceled" || status === "incomplete";
}

/** Statuses that occupy a doctor's time. Pending has no doctor. */
export function blocksDoctor(status: AppointmentStatus): boolean {
  return status === "scheduled" || status === "in_progress";
}

export function blocksPatient(status: AppointmentStatus): boolean {
  return status === "pending" || status === "scheduled" || status === "in_progress";
}

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pending",
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  canceled: "Canceled",
  incomplete: "No-show",
};
