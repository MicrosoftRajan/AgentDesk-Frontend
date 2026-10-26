import { blocksDoctor, blocksPatient } from "./status";
import {
  clinicDateString,
  clinicTimeString,
  fromMinutes,
  rangesOverlap,
  toMinutes,
  weekdayIndex,
  zonedDateTimeToUtc,
} from "./time";
import type {
  Appointment,
  ClinicData,
  DoctorSchedule,
  Profile,
  ScheduleException,
  Slot,
} from "./types";

export interface WorkingWindow {
  startMin: number;
  endMin: number;
  slotMinutes: number;
}

export function locationOf(data: ClinicData, locationId: string) {
  return data.locations.find((location) => location.id === locationId) ?? null;
}

export function profileOf(data: ClinicData, profileId: string | null) {
  if (!profileId) {
    return null;
  }
  return data.profiles.find((profile) => profile.id === profileId) ?? null;
}

export function patientOf(data: ClinicData, patientId: string) {
  return data.patients.find((patient) => patient.id === patientId) ?? null;
}

export function doctorsFor(
  data: ClinicData,
  locationId: string,
  departmentId: string | null,
): Profile[] {
  const ids = new Set(
    data.staffAssignments
      .filter((assignment) => {
        if (assignment.locationId !== locationId) {
          return false;
        }
        if (departmentId && assignment.departmentId !== departmentId) {
          return false;
        }
        return true;
      })
      .map((assignment) => assignment.userId),
  );

  return data.profiles.filter(
    (profile) => profile.role === "doctor" && ids.has(profile.id),
  );
}

export function workingWindow(
  data: ClinicData,
  doctorId: string,
  locationId: string,
  dateStr: string,
): WorkingWindow | null {
  const location = locationOf(data, locationId);
  if (!location) {
    return null;
  }

  const weekday = weekdayIndex(dateStr, location.timezone);
  const weekly = data.doctorSchedules.find(
    (row) =>
      row.doctorId === doctorId &&
      row.locationId === locationId &&
      row.weekday === weekday,
  );
  const exception = data.scheduleExceptions.find(
    (row) =>
      row.doctorId === doctorId &&
      row.locationId === locationId &&
      row.exceptionDate === dateStr,
  );

  if (exception?.kind === "unavailable") {
    return null;
  }

  if (exception?.kind === "modified_hours" && exception.startTime && exception.endTime) {
    return {
      startMin: toMinutes(exception.startTime),
      endMin: toMinutes(exception.endTime),
      slotMinutes: weekly?.slotMinutes ?? 15,
    };
  }

  if (!weekly) {
    return null;
  }

  return {
    startMin: toMinutes(weekly.startTime),
    endMin: toMinutes(weekly.endTime),
    slotMinutes: weekly.slotMinutes,
  };
}

function doctorIsBusy(
  data: ClinicData,
  doctorId: string,
  scheduledAt: string,
  durationMinutes: number,
  ignoreAppointmentId?: string,
): boolean {
  return data.appointments.some((appointment) => {
    if (appointment.id === ignoreAppointmentId) {
      return false;
    }
    if (appointment.doctorId !== doctorId || !blocksDoctor(appointment.status)) {
      return false;
    }
    return rangesOverlap(
      appointment.scheduledAt,
      appointment.durationMinutes,
      scheduledAt,
      durationMinutes,
    );
  });
}

function pendingLoad(
  data: ClinicData,
  locationId: string,
  departmentId: string | null,
  scheduledAt: string,
  durationMinutes: number,
  ignoreAppointmentId?: string,
): number {
  return data.appointments.filter((appointment) => {
    if (appointment.id === ignoreAppointmentId) {
      return false;
    }
    if (appointment.status !== "pending") {
      return false;
    }
    if (appointment.locationId !== locationId) {
      return false;
    }
    if ((appointment.departmentId ?? null) !== departmentId) {
      return false;
    }
    return rangesOverlap(
      appointment.scheduledAt,
      appointment.durationMinutes,
      scheduledAt,
      durationMinutes,
    );
  }).length;
}

function slotsForDoctor(
  data: ClinicData,
  doctorId: string,
  locationId: string,
  dateStr: string,
  durationMinutes: number,
  timeZone: string,
  ignoreAppointmentId: string | undefined,
  now: Date,
): Slot[] {
  const window = workingWindow(data, doctorId, locationId, dateStr);
  if (!window || window.slotMinutes <= 0) {
    return [];
  }

  const slots: Slot[] = [];
  for (
    let minute = window.startMin;
    minute + durationMinutes <= window.endMin;
    minute += window.slotMinutes
  ) {
    const startTime = fromMinutes(minute);
    const scheduledAt = zonedDateTimeToUtc(dateStr, startTime, timeZone).toISOString();
    if (new Date(scheduledAt).getTime() <= now.getTime()) {
      continue;
    }
    if (doctorIsBusy(data, doctorId, scheduledAt, durationMinutes, ignoreAppointmentId)) {
      continue;
    }
    slots.push({ startTime, scheduledAt });
  }
  return slots;
}

export function getAvailableSlots(
  data: ClinicData,
  args: {
    locationId: string;
    departmentId: string | null;
    durationMinutes: number;
    date: string;
    doctorId: string | null;
    ignoreAppointmentId?: string;
    now?: Date;
  },
): Slot[] {
  const location = locationOf(data, args.locationId);
  if (!location || args.durationMinutes <= 0) {
    return [];
  }

  const now = args.now ?? new Date();
  const doctors = args.doctorId
    ? doctorsFor(data, args.locationId, args.departmentId).filter(
        (doctor) => doctor.id === args.doctorId,
      )
    : doctorsFor(data, args.locationId, args.departmentId);

  if (args.doctorId) {
    return slotsForDoctor(
      data,
      args.doctorId,
      args.locationId,
      args.date,
      args.durationMinutes,
      location.timezone,
      args.ignoreAppointmentId,
      now,
    ).filter(() =>
      doctors.some((doctor) => doctor.id === args.doctorId),
    );
  }

  const byTime = new Map<string, Slot>();
  for (const doctor of doctors) {
    for (const slot of slotsForDoctor(
      data,
      doctor.id,
      args.locationId,
      args.date,
      args.durationMinutes,
      location.timezone,
      args.ignoreAppointmentId,
      now,
    )) {
      byTime.set(slot.scheduledAt, slot);
    }
  }

  return [...byTime.values()]
    .filter((slot) => {
      const cover = doctors.filter((doctor) =>
        slotsForDoctor(
          data,
          doctor.id,
          args.locationId,
          args.date,
          args.durationMinutes,
          location.timezone,
          args.ignoreAppointmentId,
          now,
        ).some((candidate) => candidate.scheduledAt === slot.scheduledAt),
      ).length;
      const pending = pendingLoad(
        data,
        args.locationId,
        args.departmentId,
        slot.scheduledAt,
        args.durationMinutes,
        args.ignoreAppointmentId,
      );
      return cover > pending;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export interface DoctorFit {
  doctor: Profile;
  ok: boolean;
  reason: string;
}

export function doctorsForSlot(
  data: ClinicData,
  appointment: Pick<
    Appointment,
    "id" | "locationId" | "departmentId" | "scheduledAt" | "durationMinutes"
  >,
): DoctorFit[] {
  const location = locationOf(data, appointment.locationId);
  if (!location) {
    return [];
  }

  const date = clinicDateString(new Date(appointment.scheduledAt), location.timezone);
  const time = clinicTimeString(new Date(appointment.scheduledAt), location.timezone);
  const doctors = doctorsFor(data, appointment.locationId, appointment.departmentId);

  return doctors.map((doctor) => {
    const window = workingWindow(data, doctor.id, appointment.locationId, date);
    if (!window) {
      return { doctor, ok: false, reason: "Not scheduled at this branch that day" };
    }
    const start = toMinutes(time);
    const end = start + appointment.durationMinutes;
    if (start < window.startMin || end > window.endMin) {
      return { doctor, ok: false, reason: "Outside this doctor's hours" };
    }
    const aligned =
      (start - window.startMin) % window.slotMinutes === 0;
    if (!aligned) {
      return { doctor, ok: false, reason: "Does not match this doctor's slot grid" };
    }
    if (
      doctorIsBusy(
        data,
        doctor.id,
        appointment.scheduledAt,
        appointment.durationMinutes,
        appointment.id,
      )
    ) {
      return { doctor, ok: false, reason: "Already booked for an overlapping visit" };
    }
    return { doctor, ok: true, reason: "Free for this visit" };
  });
}

export function appointmentFitsDoctor(
  data: ClinicData,
  appointment: Appointment,
  schedules: DoctorSchedule[] = data.doctorSchedules,
  exceptions: ScheduleException[] = data.scheduleExceptions,
): boolean {
  if (!appointment.doctorId) {
    return false;
  }
  const snapshot: ClinicData = {
    ...data,
    doctorSchedules: schedules,
    scheduleExceptions: exceptions,
  };
  const location = locationOf(snapshot, appointment.locationId);
  if (!location) {
    return false;
  }
  const date = clinicDateString(new Date(appointment.scheduledAt), location.timezone);
  const time = clinicTimeString(new Date(appointment.scheduledAt), location.timezone);
  const window = workingWindow(snapshot, appointment.doctorId, appointment.locationId, date);
  if (!window) {
    return false;
  }
  const start = toMinutes(time);
  return start >= window.startMin && start + appointment.durationMinutes <= window.endMin;
}

export function auditClinic(data: ClinicData): string[] {
  const issues: string[] = [];

  for (const appointment of data.appointments) {
    const needsDoctor =
      appointment.status === "scheduled" ||
      appointment.status === "in_progress" ||
      appointment.status === "completed";
    if (needsDoctor && !appointment.doctorId) {
      issues.push(`${appointment.reference} is ${appointment.status} without a doctor`);
    }
    if (appointment.status === "pending" && appointment.doctorId) {
      issues.push(`${appointment.reference} is pending but has a doctor`);
    }
    if (appointment.departmentId) {
      const department = data.departments.find(
        (item) => item.id === appointment.departmentId,
      );
      if (!department || department.locationId !== appointment.locationId) {
        issues.push(`${appointment.reference} department does not belong to its branch`);
      }
    }
    if (appointment.doctorId && (needsDoctor || appointment.status === "incomplete")) {
      const assigned = data.staffAssignments.some(
        (row) =>
          row.userId === appointment.doctorId &&
          row.locationId === appointment.locationId &&
          (!appointment.departmentId || row.departmentId === appointment.departmentId),
      );
      if (!assigned) {
        issues.push(`${appointment.reference} doctor is not assigned to that branch and department`);
      }
    }
    if (
      appointment.doctorId &&
      (appointment.status === "scheduled" ||
        appointment.status === "in_progress" ||
        appointment.status === "completed") &&
      !appointmentFitsDoctor(data, appointment)
    ) {
      issues.push(`${appointment.reference} sits outside the doctor's hours`);
    }
  }

  for (let i = 0; i < data.appointments.length; i += 1) {
    for (let j = i + 1; j < data.appointments.length; j += 1) {
      const a = data.appointments[i];
      const b = data.appointments[j];
      if (!rangesOverlap(a.scheduledAt, a.durationMinutes, b.scheduledAt, b.durationMinutes)) {
        continue;
      }
      if (
        a.doctorId &&
        a.doctorId === b.doctorId &&
        blocksDoctor(a.status) &&
        blocksDoctor(b.status)
      ) {
        issues.push(`${a.reference} overlaps ${b.reference} for the same doctor`);
      }
      if (
        a.patientId === b.patientId &&
        blocksPatient(a.status) &&
        blocksPatient(b.status)
      ) {
        issues.push(`${a.reference} overlaps ${b.reference} for the same patient`);
      }
    }
  }

  return issues;
}

export function weeklySummary(
  data: ClinicData,
  doctorId: string,
  locationId: string,
): string {
  const rows = data.doctorSchedules
    .filter((row) => row.doctorId === doctorId && row.locationId === locationId)
    .sort((a, b) => a.weekday - b.weekday);
  if (rows.length === 0) {
    return "No weekly hours at this branch";
  }
  const sameHours = rows.every(
    (row) => row.startTime === rows[0].startTime && row.endTime === rows[0].endTime,
  );
  const days = rows
    .map((row) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][row.weekday])
    .join(", ");
  if (sameHours) {
    return `${days} · ${rows[0].startTime}–${rows[0].endTime}`;
  }
  return days;
}
