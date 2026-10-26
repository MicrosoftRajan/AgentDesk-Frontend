import {
  doctorsForSlot,
  getAvailableSlots,
  locationOf,
  patientOf,
  profileOf,
  workingWindow,
} from "./availability";
import { canTransition } from "./status";
import {
  clinicDateString,
  clinicTimeString,
  isValidDate,
  isValidTime,
  rangesOverlap,
  toMinutes,
} from "./time";
import type {
  Appointment,
  AppointmentEvent,
  AppointmentStatus,
  ClinicData,
  ExceptionKind,
  Patient,
  ScheduleException,
} from "./types";

export interface Actor {
  id: string;
  role: "patient" | "staff" | "doctor" | "admin";
}

export interface OpResult<T> {
  ok: boolean;
  message: string;
  data: ClinicData;
  value?: T;
}

function fail<T>(data: ClinicData, message: string): OpResult<T> {
  return { ok: false, message, data };
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function nextReference(data: ClinicData): string {
  const highest = data.appointments.reduce((max, appointment) => {
    const value = Number(appointment.reference.replace(/\D/g, "")) || 0;
    return Math.max(max, value);
  }, 2423);
  return `HF-${highest + 1}`;
}

function event(
  partial: Pick<AppointmentEvent, "appointmentId" | "actorId" | "eventType"> &
    Partial<AppointmentEvent>,
): AppointmentEvent {
  return {
    id: uid("evt"),
    fromStatus: null,
    toStatus: null,
    fromDoctorId: null,
    toDoctorId: null,
    fromScheduledAt: null,
    toScheduledAt: null,
    note: null,
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

function coversLocation(data: ClinicData, actorId: string, locationId: string): boolean {
  return data.staffAssignments.some(
    (row) => row.userId === actorId && row.locationId === locationId,
  );
}

function ownsAppointment(
  data: ClinicData,
  actor: Actor,
  appointment: Appointment,
): boolean {
  if (actor.role !== "patient") {
    return false;
  }
  const patient = data.patients.find((item) => item.userId === actor.id);
  return patient?.id === appointment.patientId;
}

export function patientIsBusy(
  data: ClinicData,
  patientId: string,
  scheduledAt: string,
  durationMinutes: number,
  ignoreAppointmentId?: string,
): boolean {
  return data.appointments.some((appointment) => {
    if (appointment.id === ignoreAppointmentId) {
      return false;
    }
    if (appointment.patientId !== patientId) {
      return false;
    }
    if (
      appointment.status !== "pending" &&
      appointment.status !== "scheduled" &&
      appointment.status !== "in_progress"
    ) {
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

function replaceAppointment(
  data: ClinicData,
  appointment: Appointment,
  entry: AppointmentEvent,
): ClinicData {
  return {
    ...data,
    appointments: data.appointments.map((item) =>
      item.id === appointment.id ? appointment : item,
    ),
    events: [...data.events, entry],
  };
}

export function registerPatient(
  data: ClinicData,
  input: { fullName: string; phone: string; dateOfBirth: string | null },
): OpResult<Patient> {
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  if (fullName.length < 2) {
    return fail(data, "Enter the patient's full name.");
  }
  if (phone.replace(/\D/g, "").length < 10) {
    return fail(data, "Enter a phone number with at least 10 digits.");
  }
  if (input.dateOfBirth && !isValidDate(input.dateOfBirth)) {
    return fail(data, "Enter the date of birth as YYYY-MM-DD.");
  }
  const patient: Patient = {
    id: uid("pat"),
    userId: null,
    fullName,
    phone,
    dateOfBirth: input.dateOfBirth,
  };
  return {
    ok: true,
    message: `${fullName} is registered for this demo.`,
    data: { ...data, patients: [...data.patients, patient] },
    value: patient,
  };
}

export function updatePatient(
  data: ClinicData,
  actor: Actor,
  input: { patientId: string; fullName: string; phone: string; dateOfBirth: string | null },
): OpResult<Patient> {
  const patient = patientOf(data, input.patientId);
  if (!patient) {
    return fail(data, "That patient is not in the demo clinic.");
  }
  if (actor.role === "patient" && patient.userId !== actor.id) {
    return fail(data, "You can edit only your own details.");
  }
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  if (fullName.length < 2) {
    return fail(data, "Enter a full name.");
  }
  if (phone.replace(/\D/g, "").length < 10) {
    return fail(data, "Enter a phone number with at least 10 digits.");
  }
  if (input.dateOfBirth) {
    if (!isValidDate(input.dateOfBirth)) {
      return fail(data, "Enter the date of birth as YYYY-MM-DD.");
    }
    const today = clinicDateString(new Date(), "Asia/Kolkata");
    if (input.dateOfBirth > today) {
      return fail(data, "Date of birth cannot be in the future.");
    }
  }
  const next: Patient = {
    ...patient,
    fullName,
    phone,
    dateOfBirth: input.dateOfBirth || null,
  };
  return {
    ok: true,
    message: "Details saved in this demo.",
    data: {
      ...data,
      patients: data.patients.map((item) => (item.id === next.id ? next : item)),
    },
    value: next,
  };
}

export interface CreateInput {
  actor: Actor;
  patientId: string;
  locationId: string;
  departmentId: string;
  appointmentTypeId: string;
  doctorId: string | null;
  date: string;
  startTime: string;
  reason: string;
}

export function createAppointment(
  data: ClinicData,
  input: CreateInput,
): OpResult<Appointment> {
  const location = locationOf(data, input.locationId);
  const patient = patientOf(data, input.patientId);
  const department = data.departments.find((item) => item.id === input.departmentId);
  const type = data.appointmentTypes.find((item) => item.id === input.appointmentTypeId);
  if (!location || !patient || !department || !type) {
    return fail(data, "Choose a branch, department, service, and patient.");
  }
  if (department.locationId !== location.id) {
    return fail(data, "That department belongs to a different branch.");
  }
  if (!type.active || type.organizationId !== location.organizationId) {
    return fail(data, "That service is not offered.");
  }
  if (input.actor.role === "patient" && !ownsAppointment(data, input.actor, {
    patientId: patient.id,
  } as Appointment)) {
    return fail(data, "You can book only for your own record.");
  }
  if (
    input.actor.role !== "patient" &&
    !coversLocation(data, input.actor.id, location.id)
  ) {
    return fail(data, "This demo user is not assigned to that branch.");
  }
  const reason = input.reason.trim();
  if (reason.length > 280) {
    return fail(data, "Keep the reason under 280 characters.");
  }
  const slots = getAvailableSlots(data, {
    locationId: location.id,
    departmentId: department.id,
    durationMinutes: type.defaultDurationMinutes,
    date: input.date,
    doctorId: input.doctorId,
  });
  const slot = slots.find((item) => item.startTime === input.startTime);
  if (!slot) {
    return fail(data, "That time is no longer open. Choose another slot.");
  }
  if (
    patientIsBusy(
      data,
      patient.id,
      slot.scheduledAt,
      type.defaultDurationMinutes,
    )
  ) {
    return fail(data, "This patient already has a visit at that time.");
  }

  const appointment: Appointment = {
    id: uid("apt"),
    reference: nextReference(data),
    patientId: patient.id,
    locationId: location.id,
    departmentId: department.id,
    appointmentTypeId: type.id,
    doctorId: input.doctorId,
    scheduledAt: slot.scheduledAt,
    durationMinutes: type.defaultDurationMinutes,
    reason: reason || null,
    status: input.doctorId ? "scheduled" : "pending",
    cancelReason: null,
    createdBy: input.actor.id,
    assignedBy: null,
  };
  const entry = event({
    appointmentId: appointment.id,
    actorId: input.actor.id,
    eventType: "created",
    toStatus: appointment.status,
    toDoctorId: appointment.doctorId,
    toScheduledAt: appointment.scheduledAt,
    note: appointment.doctorId
      ? "Booked with a named doctor"
      : "Booked without a doctor. Awaiting assignment.",
  });
  const doctor = profileOf(data, appointment.doctorId);
  return {
    ok: true,
    message: appointment.doctorId
      ? `${appointment.reference} is booked with ${doctor?.fullName ?? "the doctor"}.`
      : `${appointment.reference} is booked. Awaiting doctor assignment.`,
    data: {
      ...data,
      appointments: [...data.appointments, appointment],
      events: [...data.events, entry],
    },
    value: appointment,
  };
}

export function assignDoctor(
  data: ClinicData,
  actor: Actor,
  appointmentId: string,
  doctorId: string,
): OpResult<Appointment> {
  const appointment = data.appointments.find((item) => item.id === appointmentId);
  if (!appointment) {
    return fail(data, "Appointment not found.");
  }
  if (actor.role === "patient" || actor.role === "doctor") {
    return fail(data, "Doctor assignment is a desk action in this prototype.");
  }
  if (!coversLocation(data, actor.id, appointment.locationId)) {
    return fail(data, "You are not assigned to this branch.");
  }
  if (appointment.status !== "pending" || appointment.doctorId) {
    return fail(data, "Only an unassigned pending visit can receive a doctor.");
  }
  const fit = doctorsForSlot(data, appointment).find((item) => item.doctor.id === doctorId);
  if (!fit?.ok) {
    return fail(data, fit?.reason ?? "That doctor cannot take this visit.");
  }
  const next: Appointment = {
    ...appointment,
    doctorId,
    status: "scheduled",
    assignedBy: actor.id,
  };
  const entry = event({
    appointmentId: appointment.id,
    actorId: actor.id,
    eventType: "assigned",
    fromStatus: "pending",
    toStatus: "scheduled",
    fromDoctorId: null,
    toDoctorId: doctorId,
    note: "Doctor assigned to the existing visit",
  });
  return {
    ok: true,
    message: `${fit.doctor.fullName} is assigned to ${appointment.reference}.`,
    data: replaceAppointment(data, next, entry),
    value: next,
  };
}

export function rescheduleAppointment(
  data: ClinicData,
  actor: Actor,
  appointmentId: string,
  date: string,
  startTime: string,
): OpResult<Appointment> {
  const appointment = data.appointments.find((item) => item.id === appointmentId);
  if (!appointment) {
    return fail(data, "Appointment not found.");
  }
  const allowed =
    ownsAppointment(data, actor, appointment) ||
    (actor.role !== "patient" &&
      actor.role !== "doctor" &&
      coversLocation(data, actor.id, appointment.locationId));
  if (!allowed) {
    return fail(data, "You cannot move this visit.");
  }
  if (appointment.status !== "pending" && appointment.status !== "scheduled") {
    return fail(data, "Only a pending or scheduled visit can be rescheduled.");
  }
  const slots = getAvailableSlots(data, {
    locationId: appointment.locationId,
    departmentId: appointment.departmentId,
    durationMinutes: appointment.durationMinutes,
    date,
    doctorId: appointment.doctorId,
    ignoreAppointmentId: appointment.id,
  });
  const slot = slots.find((item) => item.startTime === startTime);
  if (!slot) {
    return fail(data, "That time is not open for this visit.");
  }
  if (
    patientIsBusy(
      data,
      appointment.patientId,
      slot.scheduledAt,
      appointment.durationMinutes,
      appointment.id,
    )
  ) {
    return fail(data, "The patient already has another visit then.");
  }
  const next: Appointment = { ...appointment, scheduledAt: slot.scheduledAt };
  const entry = event({
    appointmentId: appointment.id,
    actorId: actor.id,
    eventType: "rescheduled",
    fromScheduledAt: appointment.scheduledAt,
    toScheduledAt: slot.scheduledAt,
    note: "Time changed. The same appointment record was kept.",
  });
  return {
    ok: true,
    message: `${appointment.reference} was rescheduled.`,
    data: replaceAppointment(data, next, entry),
    value: next,
  };
}

export function cancelAppointment(
  data: ClinicData,
  actor: Actor,
  appointmentId: string,
  reason: string,
): OpResult<Appointment> {
  const appointment = data.appointments.find((item) => item.id === appointmentId);
  if (!appointment) {
    return fail(data, "Appointment not found.");
  }
  const allowed =
    ownsAppointment(data, actor, appointment) ||
    ((actor.role === "staff" || actor.role === "admin") &&
      coversLocation(data, actor.id, appointment.locationId));
  if (!allowed) {
    return fail(data, "You cannot cancel this visit.");
  }
  if (!canTransition(appointment.status, "canceled")) {
    return fail(data, "This visit can no longer be canceled.");
  }
  const cancelReason = reason.trim();
  if (cancelReason.length < 3) {
    return fail(data, "Enter a short cancellation reason.");
  }
  const next: Appointment = {
    ...appointment,
    status: "canceled",
    cancelReason,
  };
  const entry = event({
    appointmentId: appointment.id,
    actorId: actor.id,
    eventType: "canceled",
    fromStatus: appointment.status,
    toStatus: "canceled",
    note: cancelReason,
  });
  return {
    ok: true,
    message: `${appointment.reference} is canceled.`,
    data: replaceAppointment(data, next, entry),
    value: next,
  };
}

export function updateAppointmentStatus(
  data: ClinicData,
  actor: Actor,
  appointmentId: string,
  status: AppointmentStatus,
  note: string | null,
): OpResult<Appointment> {
  const appointment = data.appointments.find((item) => item.id === appointmentId);
  if (!appointment) {
    return fail(data, "Appointment not found.");
  }
  if (!canTransition(appointment.status, status)) {
    return fail(data, "That status change is not allowed.");
  }

  if (status === "in_progress") {
    const desk =
      (actor.role === "staff" || actor.role === "admin") &&
      coversLocation(data, actor.id, appointment.locationId);
    const doctor = actor.role === "doctor" && actor.id === appointment.doctorId;
    if (!desk && !doctor) {
      return fail(data, "Only the assigned doctor or the branch desk can start this visit.");
    }
    if (!appointment.doctorId) {
      return fail(data, "Assign a doctor before starting the visit.");
    }
  }

  if (status === "completed") {
    if (actor.role !== "doctor" || actor.id !== appointment.doctorId) {
      return fail(data, "Only the assigned doctor can complete this visit.");
    }
  }

  if (status === "incomplete") {
    if (
      (actor.role !== "staff" && actor.role !== "admin") ||
      !coversLocation(data, actor.id, appointment.locationId)
    ) {
      return fail(data, "Only the branch desk can mark a no-show.");
    }
  }

  if (status === "canceled" || status === "scheduled" || status === "pending") {
    return fail(data, "Use the cancel, assign, or reschedule action for that change.");
  }

  const next: Appointment = { ...appointment, status };
  const entry = event({
    appointmentId: appointment.id,
    actorId: actor.id,
    eventType: "status_changed",
    fromStatus: appointment.status,
    toStatus: status,
    note,
  });
  const label =
    status === "in_progress"
      ? "in progress"
      : status === "completed"
        ? "completed"
        : "a no-show";
  return {
    ok: true,
    message: `${appointment.reference} is now ${label}.`,
    data: replaceAppointment(data, next, entry),
    value: next,
  };
}

function visitsOutsideWindow(
  data: ClinicData,
  exception: Pick<
    ScheduleException,
    "doctorId" | "locationId" | "exceptionDate" | "kind" | "startTime" | "endTime"
  >,
): boolean {
  const location = locationOf(data, exception.locationId);
  if (!location) {
    return true;
  }
  return data.appointments.some((appointment) => {
    if (appointment.doctorId !== exception.doctorId) {
      return false;
    }
    if (appointment.locationId !== exception.locationId) {
      return false;
    }
    if (
      appointment.status !== "scheduled" &&
      appointment.status !== "in_progress" &&
      appointment.status !== "completed"
    ) {
      return false;
    }
    const date = clinicDateString(new Date(appointment.scheduledAt), location.timezone);
    if (date !== exception.exceptionDate) {
      return false;
    }
    if (exception.kind === "unavailable") {
      return true;
    }
    const start = toMinutes(
      clinicTimeString(new Date(appointment.scheduledAt), location.timezone),
    );
    const end = start + appointment.durationMinutes;
    const open = toMinutes(exception.startTime ?? "00:00");
    const close = toMinutes(exception.endTime ?? "00:00");
    return start < open || end > close;
  });
}

export function addScheduleException(
  data: ClinicData,
  actor: Actor,
  input: {
    doctorId: string;
    locationId: string;
    exceptionDate: string;
    kind: ExceptionKind;
    startTime: string | null;
    endTime: string | null;
    note: string;
  },
): OpResult<ScheduleException> {
  if (actor.role !== "staff" && actor.role !== "admin") {
    return fail(data, "Schedule edits are a desk action in this prototype.");
  }
  if (!coversLocation(data, actor.id, input.locationId)) {
    return fail(data, "You are not assigned to that branch.");
  }
  if (!isValidDate(input.exceptionDate)) {
    return fail(data, "Choose a valid date.");
  }
  const assigned = data.staffAssignments.some(
    (row) => row.userId === input.doctorId && row.locationId === input.locationId,
  );
  if (!assigned) {
    return fail(data, "That doctor is not assigned to this branch.");
  }
  const duplicate = data.scheduleExceptions.some(
    (row) =>
      row.doctorId === input.doctorId &&
      row.locationId === input.locationId &&
      row.exceptionDate === input.exceptionDate,
  );
  if (duplicate) {
    return fail(data, "This doctor already has an exception on that date at this branch.");
  }
  let startTime: string | null = null;
  let endTime: string | null = null;
  if (input.kind === "modified_hours") {
    if (!input.startTime || !input.endTime || !isValidTime(input.startTime) || !isValidTime(input.endTime)) {
      return fail(data, "Enter a start and end time.");
    }
    if (toMinutes(input.endTime) <= toMinutes(input.startTime)) {
      return fail(data, "End time must be after start time.");
    }
    startTime = input.startTime;
    endTime = input.endTime;
  }
  const draft: ScheduleException = {
    id: uid("ex"),
    doctorId: input.doctorId,
    locationId: input.locationId,
    exceptionDate: input.exceptionDate,
    kind: input.kind,
    startTime,
    endTime,
    note: input.note.trim() || null,
    createdBy: actor.id,
  };
  if (visitsOutsideWindow(data, draft)) {
    return fail(data, "An existing visit that day would fall outside the new hours.");
  }
  return {
    ok: true,
    message: "Exception saved for that date and branch only.",
    data: { ...data, scheduleExceptions: [...data.scheduleExceptions, draft] },
    value: draft,
  };
}

export function removeScheduleException(
  data: ClinicData,
  actor: Actor,
  exceptionId: string,
): OpResult<null> {
  const current = data.scheduleExceptions.find((row) => row.id === exceptionId);
  if (!current) {
    return fail(data, "Exception not found.");
  }
  if ((actor.role !== "staff" && actor.role !== "admin") || !coversLocation(data, actor.id, current.locationId)) {
    return fail(data, "You cannot remove that exception.");
  }
  const nextData = {
    ...data,
    scheduleExceptions: data.scheduleExceptions.filter((row) => row.id !== exceptionId),
  };
  const location = locationOf(data, current.locationId);
  if (location) {
    const broken = data.appointments.some((appointment) => {
      if (appointment.doctorId !== current.doctorId || appointment.locationId !== current.locationId) {
        return false;
      }
      if (
        appointment.status !== "scheduled" &&
        appointment.status !== "in_progress" &&
        appointment.status !== "completed"
      ) {
        return false;
      }
      if (clinicDateString(new Date(appointment.scheduledAt), location.timezone) !== current.exceptionDate) {
        return false;
      }
      const window = workingWindow(nextData, current.doctorId, current.locationId, current.exceptionDate);
      if (!window) {
        return true;
      }
      const start = toMinutes(clinicTimeString(new Date(appointment.scheduledAt), location.timezone));
      return start < window.startMin || start + appointment.durationMinutes > window.endMin;
    });
    if (broken) {
      return fail(data, "Removing this exception would leave a visit outside working hours.");
    }
  }
  return {
    ok: true,
    message: "Exception removed. Weekly hours apply to that date again.",
    data: nextData,
    value: null,
  };
}
