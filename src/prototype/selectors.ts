import {
  locationOf,
  patientOf,
  profileOf,
  weeklySummary,
} from "./availability";
import { STATUS_LABEL } from "./status";
import { clinicDateString, formatClock, formatDateTime } from "./time";
import type { Appointment, AppointmentEvent, ClinicData, DemoSession } from "./types";

export interface AppointmentView {
  appointment: Appointment;
  reference: string;
  patientName: string;
  patientPhone: string;
  patientDob: string | null;
  locationName: string;
  locationLine: string;
  address: string;
  timezone: string;
  departmentName: string;
  serviceName: string;
  durationMinutes: number;
  doctorName: string;
  unassigned: boolean;
  when: string;
  timeLabel: string;
  dateKey: string;
}

export function presentAppointment(
  data: ClinicData,
  appointment: Appointment,
): AppointmentView {
  const location = locationOf(data, appointment.locationId);
  const patient = patientOf(data, appointment.patientId);
  const department = data.departments.find((item) => item.id === appointment.departmentId);
  const service = data.appointmentTypes.find(
    (item) => item.id === appointment.appointmentTypeId,
  );
  const timezone = location?.timezone ?? "Asia/Kolkata";
  const doctor = profileOf(data, appointment.doctorId);
  return {
    appointment,
    reference: appointment.reference,
    patientName: patient?.fullName ?? "Unknown patient",
    patientPhone: patient?.phone ?? "",
    patientDob: patient?.dateOfBirth ?? null,
    locationName: location?.name ?? "Branch",
    locationLine: location ? `${data.organization.name} · ${location.name}` : "Branch",
    address: location?.address ?? "",
    timezone,
    departmentName: department
      ? `${department.name} · ${location?.name ?? "Branch"}`
      : "No department",
    serviceName: service?.name ?? "Visit",
    durationMinutes: appointment.durationMinutes,
    doctorName: doctor?.fullName ?? "Awaiting assignment",
    unassigned: !appointment.doctorId,
    when: formatDateTime(appointment.scheduledAt, timezone),
    timeLabel: formatClock(appointment.scheduledAt, timezone),
    dateKey: clinicDateString(new Date(appointment.scheduledAt), timezone),
  };
}

export function appointmentEnd(appointment: Appointment): number {
  return new Date(appointment.scheduledAt).getTime() + appointment.durationMinutes * 60_000;
}

export function isOpenVisit(appointment: Appointment, now: Date): boolean {
  if (appointment.status === "in_progress") {
    return true;
  }
  if (appointment.status !== "pending" && appointment.status !== "scheduled") {
    return false;
  }
  return appointmentEnd(appointment) > now.getTime();
}

export function patientForSession(data: ClinicData, session: DemoSession) {
  if (session.role !== "patient") {
    return null;
  }
  return data.patients.find((patient) => patient.userId === session.profileId) ?? null;
}

export function describeEvent(data: ClinicData, item: AppointmentEvent): string {
  const actor = item.actorId
    ? profileOf(data, item.actorId)?.fullName ?? "Someone"
    : "System";
  const appointment = data.appointments.find((row) => row.id === item.appointmentId);
  const reference = appointment?.reference ?? "a visit";
  if (item.eventType === "created") {
    return `${actor} booked ${reference}`;
  }
  if (item.eventType === "assigned") {
    const doctor = profileOf(data, item.toDoctorId)?.fullName ?? "a doctor";
    return `${actor} assigned ${doctor} to ${reference}`;
  }
  if (item.eventType === "rescheduled") {
    return `${actor} rescheduled ${reference}`;
  }
  if (item.eventType === "canceled") {
    return `${actor} canceled ${reference}`;
  }
  const next = item.toStatus ? STATUS_LABEL[item.toStatus] : "updated";
  return `${actor} marked ${reference} ${next.toLowerCase()}`;
}

export function eventsFor(
  data: ClinicData,
  session: DemoSession,
  focusLocationId: string,
): AppointmentEvent[] {
  const allowed = new Set<string>();
  if (session.role === "patient") {
    const patient = patientForSession(data, session);
    data.appointments
      .filter((appointment) => appointment.patientId === patient?.id)
      .forEach((appointment) => allowed.add(appointment.id));
  } else if (session.role === "doctor") {
    data.appointments
      .filter((appointment) => appointment.doctorId === session.profileId)
      .forEach((appointment) => allowed.add(appointment.id));
  } else {
    data.appointments
      .filter((appointment) => appointment.locationId === focusLocationId)
      .forEach((appointment) => allowed.add(appointment.id));
  }
  return data.events
    .filter((item) => allowed.has(item.appointmentId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function greeting(name: string, timeZone: string): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date()),
  );
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const first = name.trim().split(/\s+/)[0] ?? name;
  return `${hello}, ${first}`;
}

export function scheduleLine(
  data: ClinicData,
  doctorId: string,
  locationId: string,
): string {
  return weeklySummary(data, doctorId, locationId);
}

export { STATUS_LABEL };
