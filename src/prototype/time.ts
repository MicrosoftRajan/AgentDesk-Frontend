/** Clinic-local time helpers. Demo locations use Asia/Kolkata, which has no DST. */

export const CLINIC_TZ = "Asia/Kolkata";

export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function partsInZone(date: Date, timeZone: string) {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const pick = (type: string) =>
    formatted.find((part) => part.type === type)?.value ?? "00";

  let hour = Number(pick("hour"));
  if (hour === 24) {
    hour = 0;
  }

  return {
    year: Number(pick("year")),
    month: Number(pick("month")),
    day: Number(pick("day")),
    hour,
    minute: Number(pick("minute")),
    second: Number(pick("second")),
  };
}

function zoneOffsetMs(date: Date, timeZone: string): number {
  const part = partsInZone(date, timeZone);
  const asUtc = Date.UTC(
    part.year,
    part.month - 1,
    part.day,
    part.hour,
    part.minute,
    part.second,
  );
  return asUtc - date.getTime();
}

export function zonedDateTimeToUtc(
  dateStr: string,
  timeStr: string,
  timeZone: string,
): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset = zoneOffsetMs(new Date(guess), timeZone);
  const utc = guess - offset;
  const corrected = zoneOffsetMs(new Date(utc), timeZone);
  return new Date(guess - corrected);
}

export function clinicDateString(date: Date, timeZone: string): string {
  const part = partsInZone(date, timeZone);
  const month = String(part.month).padStart(2, "0");
  const day = String(part.day).padStart(2, "0");
  return `${part.year}-${month}-${day}`;
}

export function clinicTimeString(date: Date, timeZone: string): string {
  const part = partsInZone(date, timeZone);
  return `${String(part.hour).padStart(2, "0")}:${String(part.minute).padStart(2, "0")}`;
}

export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, "0");
  const d = String(next.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function weekdayIndex(dateStr: string, timeZone: string): number {
  const noon = zonedDateTimeToUtc(dateStr, "12:00", timeZone);
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(noon);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(label);
}

export function toMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

export function fromMinutes(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function formatTimeLabel(time: string): string {
  const [hourRaw, minute] = time.split(":").map(Number);
  const suffix = hourRaw >= 12 ? "PM" : "AM";
  const hour = hourRaw % 12 || 12;
  return `${hour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function formatDateLabel(dateStr: string, timeZone: string): string {
  const noon = zonedDateTimeToUtc(dateStr, "12:00", timeZone);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(noon);
}

export function formatDateTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export function formatClock(iso: string, timeZone: string): string {
  return formatTimeLabel(clinicTimeString(new Date(iso), timeZone));
}

export function rangesOverlap(
  aStartIso: string,
  aMinutes: number,
  bStartIso: string,
  bMinutes: number,
): boolean {
  const a0 = new Date(aStartIso).getTime();
  const b0 = new Date(bStartIso).getTime();
  const a1 = a0 + aMinutes * 60_000;
  const b1 = b0 + bMinutes * 60_000;
  return a0 < b1 && b0 < a1;
}

export function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}
