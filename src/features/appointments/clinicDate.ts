/**
 * The clinic runs on IST, so "today" and appointment times are always
 * shown in IST regardless of the phone's timezone.
 */
const CLINIC_TIME_ZONE = "Asia/Kolkata";
const DAY_MS = 24 * 60 * 60 * 1000;

/** Today's clinic date as YYYY-MM-DD. */
export function todayInClinic(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: CLINIC_TIME_ZONE,
  });
}

/** The clinic (IST) calendar date, YYYY-MM-DD, of an ISO timestamp. */
export function clinicDateOf(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: CLINIC_TIME_ZONE,
  });
}

/** Moves a YYYY-MM-DD date forwards/backwards by whole days. */
export function shiftDate(date: string, days: number): string {
  const time = Date.parse(`${date}T12:00:00Z`);

  return new Date(time + days * DAY_MS).toISOString().slice(0, 10);
}

/** "Today", "Tomorrow", "Yesterday" or e.g. "Thu, 9 Oct". */
export function describeDate(date: string): string {
  const today = todayInClinic();

  if (date === today) return "Today";
  if (date === shiftDate(today, 1)) return "Tomorrow";
  if (date === shiftDate(today, -1)) return "Yesterday";

  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** "4:30 pm" in clinic time. */
export function formatClinicTime(iso: string): string {
  const date = new Date(iso);

  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: CLINIC_TIME_ZONE,
      });
}
