import type { PatientAppointment } from "../../services/api/patients";

/**
 * How many days ahead a patient can book. Mirrors MAX_DAYS_AHEAD on the
 * server, which is the source of truth and rejects anything beyond it.
 */
export const BOOKING_WINDOW_DAYS = 30;

export function isUpcoming(
  appointment: PatientAppointment,
  now: number = Date.now(),
): boolean {
  return (
    appointment.status === "scheduled" &&
    Date.parse(appointment.scheduledAt) > now
  );
}

/** Upcoming (soonest first) and everything else (most recent first). */
export function splitAppointments(appointments: PatientAppointment[]): {
  upcoming: PatientAppointment[];
  past: PatientAppointment[];
} {
  const now = Date.now();

  const upcoming = appointments
    .filter((item) => isUpcoming(item, now))
    .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));

  const past = appointments
    .filter((item) => !isUpcoming(item, now))
    .sort((a, b) => Date.parse(b.scheduledAt) - Date.parse(a.scheduledAt));

  return { upcoming, past };
}

const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{6,18}$/;

/** Mirrors the server's validation so people get instant feedback. */
export function validateContactDetails(
  fullName: string,
  phone: string,
): string | null {
  if (!fullName.trim()) {
    return "Enter your full name.";
  }

  if (fullName.trim().length > 100) {
    return "Name must be under 100 characters.";
  }

  if (!PHONE_PATTERN.test(phone.trim())) {
    return "Enter a valid phone number, e.g. +919876543210.";
  }

  return null;
}
