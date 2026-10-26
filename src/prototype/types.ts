/**
 * Prototype types aligned with docs/DATA_MODEL.md and docs/ER_DIAGRAMS.md.
 * Fields marked as display-only are not ER columns. They exist so the UI can
 * show an address or a human reference without inventing a table.
 */

export type DemoRole = "patient" | "staff" | "doctor";

export type AppointmentStatus =
  | "pending"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "canceled"
  | "incomplete";

export type EventType =
  | "created"
  | "assigned"
  | "status_changed"
  | "rescheduled"
  | "canceled";

export type ExceptionKind = "unavailable" | "modified_hours";

export interface Organization {
  id: string;
  name: string;
}

export interface Location {
  id: string;
  organizationId: string;
  name: string;
  timezone: string;
  /** Display-only. The ER location row has name and timezone, not an address. */
  address: string;
}

export interface Department {
  id: string;
  locationId: string;
  name: string;
}

export interface Profile {
  id: string;
  role: DemoRole | "admin";
  fullName: string;
  phone: string;
}

export interface StaffAssignment {
  id: string;
  userId: string;
  locationId: string;
  departmentId: string | null;
}

export interface Patient {
  id: string;
  userId: string | null;
  fullName: string;
  phone: string;
  dateOfBirth: string | null;
}

export interface AppointmentType {
  id: string;
  organizationId: string;
  name: string;
  defaultDurationMinutes: number;
  active: boolean;
}

export interface ScheduleTemplate {
  id: string;
  organizationId: string;
  name: string;
}

export interface TemplateShift {
  id: string;
  templateId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  locationId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  sourceTemplateId: string | null;
}

export interface ScheduleException {
  id: string;
  doctorId: string;
  locationId: string;
  exceptionDate: string;
  kind: ExceptionKind;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
  createdBy: string | null;
}

export interface Appointment {
  id: string;
  /** Display reference. The ER uses the uuid as the key and has no reference column. */
  reference: string;
  patientId: string;
  locationId: string;
  departmentId: string | null;
  appointmentTypeId: string;
  doctorId: string | null;
  scheduledAt: string;
  durationMinutes: number;
  reason: string | null;
  status: AppointmentStatus;
  cancelReason: string | null;
  createdBy: string | null;
  assignedBy: string | null;
}

export interface AppointmentEvent {
  id: string;
  appointmentId: string;
  actorId: string | null;
  eventType: EventType;
  fromStatus: AppointmentStatus | null;
  toStatus: AppointmentStatus | null;
  fromDoctorId: string | null;
  toDoctorId: string | null;
  fromScheduledAt: string | null;
  toScheduledAt: string | null;
  note: string | null;
  createdAt: string;
}

export interface ClinicData {
  organization: Organization;
  locations: Location[];
  departments: Department[];
  profiles: Profile[];
  staffAssignments: StaffAssignment[];
  patients: Patient[];
  appointmentTypes: AppointmentType[];
  scheduleTemplates: ScheduleTemplate[];
  templateShifts: TemplateShift[];
  doctorSchedules: DoctorSchedule[];
  scheduleExceptions: ScheduleException[];
  appointments: Appointment[];
  events: AppointmentEvent[];
}

export interface DemoSession {
  role: DemoRole;
  profileId: string;
}

export interface Slot {
  startTime: string;
  scheduledAt: string;
}

export interface ActionResult<T> {
  ok: boolean;
  message: string;
  value?: T;
}
