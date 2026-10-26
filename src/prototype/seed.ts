import { auditClinic } from "./availability";
import {
  CLINIC_TZ,
  addDays,
  weekdayIndex,
  zonedDateTimeToUtc,
} from "./time";
import type {
  Appointment,
  AppointmentEvent,
  AppointmentType,
  ClinicData,
  Department,
  DoctorSchedule,
  Patient,
  Profile,
  ScheduleException,
  StaffAssignment,
  TemplateShift,
} from "./types";

/** Stable ids for the HealthFirst demonstration clinic. */
export const IDS = {
  org: "org-healthfirst",
  andheri: "loc-andheri",
  bandra: "loc-bandra",
  andGeneral: "dept-and-general",
  andCardio: "dept-and-cardio",
  andDerm: "dept-and-derm",
  banGeneral: "dept-ban-general",
  banPeds: "dept-ban-peds",
  banDerm: "dept-ban-derm",
  priyaProfile: "prof-priya",
  aisha: "prof-aisha",
  anika: "prof-anika",
  rohan: "prof-rohan",
  meera: "prof-meera",
  kabir: "prof-kabir",
  priya: "pat-priya",
  arjun: "pat-arjun",
  neha: "pat-neha",
  vikram: "pat-vikram",
  sana: "pat-sana",
  imaan: "pat-imaan",
  farhan: "pat-farhan",
  leela: "pat-leela",
  omar: "pat-omar",
  general: "type-general",
  followUp: "type-followup",
  specialist: "type-specialist",
  template: "tmpl-clinic-day",
} as const;

const TZ = CLINIC_TZ;

function iso(date: string, time: string): string {
  return zonedDateTimeToUtc(date, time, TZ).toISOString();
}

function shiftWorkday(dateStr: string, steps: number): string {
  const direction = steps >= 0 ? 1 : -1;
  let left = Math.abs(steps);
  let cursor = dateStr;
  while (left > 0) {
    cursor = addDays(cursor, direction);
    if (weekdayIndex(cursor, TZ) !== 0) {
      left -= 1;
    }
  }
  return cursor;
}

function before(isoStamp: string, minutes: number): string {
  return new Date(new Date(isoStamp).getTime() - minutes * 60_000).toISOString();
}

/**
 * Builds a consistent HealthFirst dataset around the clinic's current date.
 * Addresses are display-only. The location table stores name and timezone.
 */
export function buildSeed(now = new Date()): ClinicData {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const todayIsOpen = weekdayIndex(today, TZ) !== 0;
  const boardDay = todayIsOpen ? today : shiftWorkday(today, 1);
  const upcomingDay = shiftWorkday(today, 1);
  const pendingDay = shiftWorkday(today, 4);
  const completedDay = shiftWorkday(today, -2);
  const canceledDay = shiftWorkday(today, -5);
  const exceptionDay = shiftWorkday(today, 6);
  const modifiedDay = shiftWorkday(today, 3);

  const profiles: Profile[] = [
    { id: IDS.priyaProfile, role: "patient", fullName: "Priya Sharma", phone: "+91 98200 11420" },
    { id: IDS.aisha, role: "staff", fullName: "Aisha Khan", phone: "+91 98200 22011" },
    { id: IDS.anika, role: "doctor", fullName: "Dr. Anika Mehta", phone: "+91 98200 33021" },
    { id: IDS.rohan, role: "doctor", fullName: "Dr. Rohan Iyer", phone: "+91 98200 33022" },
    { id: IDS.meera, role: "doctor", fullName: "Dr. Meera Kapoor", phone: "+91 98200 33023" },
    { id: IDS.kabir, role: "doctor", fullName: "Dr. Kabir Shah", phone: "+91 98200 33024" },
  ];

  const departments: Department[] = [
    { id: IDS.andGeneral, locationId: IDS.andheri, name: "General Medicine" },
    { id: IDS.andCardio, locationId: IDS.andheri, name: "Cardiology" },
    { id: IDS.andDerm, locationId: IDS.andheri, name: "Dermatology" },
    { id: IDS.banGeneral, locationId: IDS.bandra, name: "General Medicine" },
    { id: IDS.banPeds, locationId: IDS.bandra, name: "Pediatrics" },
    { id: IDS.banDerm, locationId: IDS.bandra, name: "Dermatology" },
  ];

  const assignment = (
    id: string,
    userId: string,
    locationId: string,
    departmentId: string | null,
  ): StaffAssignment => ({ id, userId, locationId, departmentId });

  const staffAssignments: StaffAssignment[] = [
    assignment("asg-aisha-and", IDS.aisha, IDS.andheri, null),
    assignment("asg-aisha-ban", IDS.aisha, IDS.bandra, null),
    assignment("asg-anika-and", IDS.anika, IDS.andheri, IDS.andGeneral),
    assignment("asg-anika-ban", IDS.anika, IDS.bandra, IDS.banGeneral),
    assignment("asg-rohan-and", IDS.rohan, IDS.andheri, IDS.andCardio),
    assignment("asg-meera-ban", IDS.meera, IDS.bandra, IDS.banPeds),
    assignment("asg-kabir-and", IDS.kabir, IDS.andheri, IDS.andDerm),
    assignment("asg-kabir-ban", IDS.kabir, IDS.bandra, IDS.banDerm),
  ];

  const patients: Patient[] = [
    { id: IDS.priya, userId: IDS.priyaProfile, fullName: "Priya Sharma", phone: "+91 98200 11420", dateOfBirth: "1994-06-18" },
    { id: IDS.arjun, userId: null, fullName: "Arjun Desai", phone: "+91 98111 10001", dateOfBirth: "1988-02-02" },
    { id: IDS.neha, userId: null, fullName: "Neha Kulkarni", phone: "+91 98111 10002", dateOfBirth: "1991-11-09" },
    { id: IDS.vikram, userId: null, fullName: "Vikram Patel", phone: "+91 98111 10003", dateOfBirth: null },
    { id: IDS.sana, userId: null, fullName: "Sana Qureshi", phone: "+91 98111 10004", dateOfBirth: "1997-01-21" },
    { id: IDS.imaan, userId: null, fullName: "Imaan Joshi", phone: "+91 98111 10005", dateOfBirth: null },
    { id: IDS.farhan, userId: null, fullName: "Farhan Ali", phone: "+91 98111 10006", dateOfBirth: "1985-08-30" },
    { id: IDS.leela, userId: null, fullName: "Leela Nair", phone: "+91 98111 10007", dateOfBirth: "2018-04-12" },
    { id: IDS.omar, userId: null, fullName: "Omar Sethi", phone: "+91 98111 10008", dateOfBirth: "1990-12-01" },
  ];

  const appointmentTypes: AppointmentType[] = [
    { id: IDS.general, organizationId: IDS.org, name: "General Consultation", defaultDurationMinutes: 15, active: true },
    { id: IDS.followUp, organizationId: IDS.org, name: "Follow-up", defaultDurationMinutes: 10, active: true },
    { id: IDS.specialist, organizationId: IDS.org, name: "Specialist Consultation", defaultDurationMinutes: 30, active: true },
  ];

  const templateShifts: TemplateShift[] = [1, 2, 3, 4, 5, 6].map((weekday) => ({
    id: `shift-${weekday}`,
    templateId: IDS.template,
    weekday,
    startTime: "09:00",
    endTime: "17:00",
    slotMinutes: 15,
  }));

  const doctorPlans: { doctorId: string; locationId: string; slotMinutes: number }[] = [
    { doctorId: IDS.anika, locationId: IDS.andheri, slotMinutes: 15 },
    { doctorId: IDS.anika, locationId: IDS.bandra, slotMinutes: 15 },
    { doctorId: IDS.rohan, locationId: IDS.andheri, slotMinutes: 30 },
    { doctorId: IDS.meera, locationId: IDS.bandra, slotMinutes: 15 },
    { doctorId: IDS.kabir, locationId: IDS.andheri, slotMinutes: 15 },
    { doctorId: IDS.kabir, locationId: IDS.bandra, slotMinutes: 15 },
  ];

  const doctorSchedules: DoctorSchedule[] = doctorPlans.flatMap((plan) =>
    templateShifts.map((shift) => ({
      id: `sch-${plan.doctorId}-${plan.locationId}-${shift.weekday}`,
      doctorId: plan.doctorId,
      locationId: plan.locationId,
      weekday: shift.weekday,
      startTime: shift.startTime,
      endTime: shift.endTime,
      slotMinutes: plan.slotMinutes,
      sourceTemplateId: IDS.template,
    })),
  );

  const scheduleExceptions: ScheduleException[] = [
    {
      id: "ex-rohan-away",
      doctorId: IDS.rohan,
      locationId: IDS.andheri,
      exceptionDate: exceptionDay,
      kind: "unavailable",
      startTime: null,
      endTime: null,
      note: "Cardiology conference. This date only.",
      createdBy: IDS.aisha,
    },
    {
      id: "ex-meera-hours",
      doctorId: IDS.meera,
      locationId: IDS.bandra,
      exceptionDate: modifiedDay,
      kind: "modified_hours",
      startTime: "12:00",
      endTime: "16:00",
      note: "Morning rounds off site. Afternoon clinic only.",
      createdBy: IDS.aisha,
    },
  ];

  const appointments: Appointment[] = [];
  const events: AppointmentEvent[] = [];

  const push = (
    appointment: Appointment,
    history: {
      actorId: string;
      at: string;
      type: AppointmentEvent["eventType"];
      fromStatus?: Appointment["status"] | null;
      toStatus?: Appointment["status"] | null;
      fromDoctorId?: string | null;
      toDoctorId?: string | null;
      fromScheduledAt?: string | null;
      toScheduledAt?: string | null;
      note?: string | null;
    }[],
  ) => {
    appointments.push(appointment);
    history.forEach((item, index) => {
      events.push({
        id: `evt-${appointment.id}-${index}`,
        appointmentId: appointment.id,
        actorId: item.actorId,
        eventType: item.type,
        fromStatus: item.fromStatus ?? null,
        toStatus: item.toStatus ?? null,
        fromDoctorId: item.fromDoctorId ?? null,
        toDoctorId: item.toDoctorId ?? null,
        fromScheduledAt: item.fromScheduledAt ?? null,
        toScheduledAt: item.toScheduledAt ?? null,
        note: item.note ?? null,
        createdAt: item.at,
      });
    });
  };

  const visit = (
    partial: Pick<
      Appointment,
      | "id"
      | "reference"
      | "patientId"
      | "locationId"
      | "departmentId"
      | "appointmentTypeId"
      | "doctorId"
      | "scheduledAt"
      | "durationMinutes"
      | "reason"
      | "status"
      | "cancelReason"
      | "createdBy"
      | "assignedBy"
    >,
  ): Appointment => partial;

  if (todayIsOpen) {
    const arjunAt = iso(boardDay, "09:00");
    push(
      visit({
        id: "apt-arjun-today",
        reference: "HF-2410",
        patientId: IDS.arjun,
        locationId: IDS.andheri,
        departmentId: IDS.andGeneral,
        appointmentTypeId: IDS.general,
        doctorId: IDS.anika,
        scheduledAt: arjunAt,
        durationMinutes: 15,
        reason: "Fever and sore throat for two days",
        status: "scheduled",
        cancelReason: null,
        createdBy: IDS.aisha,
        assignedBy: null,
      }),
      [
        {
          actorId: IDS.aisha,
          at: before(arjunAt, 20 * 60),
          type: "created",
          toStatus: "scheduled",
          toDoctorId: IDS.anika,
          toScheduledAt: arjunAt,
          note: "Booked at the Andheri desk",
        },
      ],
    );

    const nehaAt = iso(boardDay, "09:30");
    push(
      visit({
        id: "apt-neha-today",
        reference: "HF-2411",
        patientId: IDS.neha,
        locationId: IDS.andheri,
        departmentId: IDS.andGeneral,
        appointmentTypeId: IDS.specialist,
        doctorId: IDS.anika,
        scheduledAt: nehaAt,
        durationMinutes: 30,
        reason: "Migraine review",
        status: "in_progress",
        cancelReason: null,
        createdBy: IDS.aisha,
        assignedBy: null,
      }),
      [
        {
          actorId: IDS.aisha,
          at: before(nehaAt, 26 * 60),
          type: "created",
          toStatus: "scheduled",
          toDoctorId: IDS.anika,
          toScheduledAt: nehaAt,
        },
        {
          actorId: IDS.anika,
          at: nehaAt,
          type: "status_changed",
          fromStatus: "scheduled",
          toStatus: "in_progress",
          note: "Visit started",
        },
      ],
    );

    const vikramAt = iso(boardDay, "10:30");
    push(
      visit({
        id: "apt-vikram-today",
        reference: "HF-2412",
        patientId: IDS.vikram,
        locationId: IDS.andheri,
        departmentId: IDS.andCardio,
        appointmentTypeId: IDS.specialist,
        doctorId: IDS.rohan,
        scheduledAt: vikramAt,
        durationMinutes: 30,
        reason: "Blood pressure follow-up",
        status: "scheduled",
        cancelReason: null,
        createdBy: IDS.aisha,
        assignedBy: null,
      }),
      [
        {
          actorId: IDS.aisha,
          at: before(vikramAt, 30 * 60),
          type: "created",
          toStatus: "scheduled",
          toDoctorId: IDS.rohan,
          toScheduledAt: vikramAt,
        },
      ],
    );

    const sanaAt = iso(boardDay, "11:00");
    push(
      visit({
        id: "apt-sana-today",
        reference: "HF-2413",
        patientId: IDS.sana,
        locationId: IDS.andheri,
        departmentId: IDS.andDerm,
        appointmentTypeId: IDS.followUp,
        doctorId: IDS.kabir,
        scheduledAt: sanaAt,
        durationMinutes: 10,
        reason: "Rash follow-up",
        status: "scheduled",
        cancelReason: null,
        createdBy: IDS.aisha,
        assignedBy: null,
      }),
      [
        {
          actorId: IDS.aisha,
          at: before(sanaAt, 18 * 60),
          type: "created",
          toStatus: "scheduled",
          toDoctorId: IDS.kabir,
          toScheduledAt: sanaAt,
        },
      ],
    );

    const imaanAt = iso(boardDay, "14:00");
    push(
      visit({
        id: "apt-imaan-today",
        reference: "HF-2414",
        patientId: IDS.imaan,
        locationId: IDS.andheri,
        departmentId: IDS.andGeneral,
        appointmentTypeId: IDS.followUp,
        doctorId: IDS.anika,
        scheduledAt: imaanAt,
        durationMinutes: 10,
        reason: "Lab result review",
        status: "completed",
        cancelReason: null,
        createdBy: IDS.aisha,
        assignedBy: null,
      }),
      [
        {
          actorId: IDS.aisha,
          at: before(imaanAt, 48 * 60),
          type: "created",
          toStatus: "scheduled",
          toDoctorId: IDS.anika,
          toScheduledAt: imaanAt,
        },
        {
          actorId: IDS.anika,
          at: imaanAt,
          type: "status_changed",
          fromStatus: "scheduled",
          toStatus: "in_progress",
        },
        {
          actorId: IDS.anika,
          at: before(iso(boardDay, "14:10"), -1),
          type: "status_changed",
          fromStatus: "in_progress",
          toStatus: "completed",
          note: "Visit completed",
        },
      ],
    );

    const farhanMissed = iso(boardDay, "15:00");
    push(
      visit({
        id: "apt-farhan-missed",
        reference: "HF-2415",
        patientId: IDS.farhan,
        locationId: IDS.andheri,
        departmentId: IDS.andCardio,
        appointmentTypeId: IDS.general,
        doctorId: IDS.rohan,
        scheduledAt: farhanMissed,
        durationMinutes: 15,
        reason: "Chest discomfort check",
        status: "incomplete",
        cancelReason: null,
        createdBy: IDS.aisha,
        assignedBy: null,
      }),
      [
        {
          actorId: IDS.aisha,
          at: before(farhanMissed, 24 * 60),
          type: "created",
          toStatus: "scheduled",
          toDoctorId: IDS.rohan,
          toScheduledAt: farhanMissed,
        },
        {
          actorId: IDS.aisha,
          at: before(farhanMissed, -20),
          type: "status_changed",
          fromStatus: "scheduled",
          toStatus: "incomplete",
          note: "Patient did not arrive",
        },
      ],
    );

    const leelaAt = iso(boardDay, "10:00");
    push(
      visit({
        id: "apt-leela-today",
        reference: "HF-2416",
        patientId: IDS.leela,
        locationId: IDS.bandra,
        departmentId: IDS.banPeds,
        appointmentTypeId: IDS.general,
        doctorId: IDS.meera,
        scheduledAt: leelaAt,
        durationMinutes: 15,
        reason: "Routine child wellness visit",
        status: "scheduled",
        cancelReason: null,
        createdBy: IDS.aisha,
        assignedBy: null,
      }),
      [
        {
          actorId: IDS.aisha,
          at: before(leelaAt, 12 * 60),
          type: "created",
          toStatus: "scheduled",
          toDoctorId: IDS.meera,
          toScheduledAt: leelaAt,
        },
      ],
    );

    const omarAt = iso(boardDay, "12:00");
    push(
      visit({
        id: "apt-omar-today",
        reference: "HF-2417",
        patientId: IDS.omar,
        locationId: IDS.bandra,
        departmentId: IDS.banDerm,
        appointmentTypeId: IDS.specialist,
        doctorId: IDS.kabir,
        scheduledAt: omarAt,
        durationMinutes: 30,
        reason: "Acne consultation",
        status: "scheduled",
        cancelReason: null,
        createdBy: IDS.aisha,
        assignedBy: null,
      }),
      [
        {
          actorId: IDS.aisha,
          at: before(omarAt, 10 * 60),
          type: "created",
          toStatus: "scheduled",
          toDoctorId: IDS.kabir,
          toScheduledAt: omarAt,
        },
      ],
    );

    const farhanPending = iso(boardDay, "16:15");
    push(
      visit({
        id: "apt-farhan-pending",
        reference: "HF-2418",
        patientId: IDS.farhan,
        locationId: IDS.andheri,
        departmentId: IDS.andGeneral,
        appointmentTypeId: IDS.general,
        doctorId: null,
        scheduledAt: farhanPending,
        durationMinutes: 15,
        reason: "Walk-in hold for the next free physician",
        status: "pending",
        cancelReason: null,
        createdBy: IDS.aisha,
        assignedBy: null,
      }),
      [
        {
          actorId: IDS.aisha,
          at: before(farhanPending, 60),
          type: "created",
          toStatus: "pending",
          toScheduledAt: farhanPending,
          note: "Booked without a doctor",
        },
      ],
    );
  }

  const priyaNext = iso(upcomingDay, "10:15");
  push(
    visit({
      id: "apt-priya-next",
      reference: "HF-2419",
      patientId: IDS.priya,
      locationId: IDS.andheri,
      departmentId: IDS.andGeneral,
      appointmentTypeId: IDS.general,
      doctorId: IDS.anika,
      scheduledAt: priyaNext,
      durationMinutes: 15,
      reason: "Seasonal allergy review",
      status: "scheduled",
      cancelReason: null,
      createdBy: IDS.priyaProfile,
      assignedBy: null,
    }),
    [
      {
        actorId: IDS.priyaProfile,
        at: before(priyaNext, 6 * 60),
        type: "created",
        toStatus: "scheduled",
        toDoctorId: IDS.anika,
        toScheduledAt: priyaNext,
        note: "Booked in the patient portal",
      },
    ],
  );

  const omarNext = iso(upcomingDay, "11:30");
  push(
    visit({
      id: "apt-omar-next",
      reference: "HF-2423",
      patientId: IDS.omar,
      locationId: IDS.bandra,
      departmentId: IDS.banGeneral,
      appointmentTypeId: IDS.general,
      doctorId: IDS.anika,
      scheduledAt: omarNext,
      durationMinutes: 15,
      reason: "Fatigue and follow-up questions",
      status: "scheduled",
      cancelReason: null,
      createdBy: IDS.aisha,
      assignedBy: null,
    }),
    [
      {
        actorId: IDS.aisha,
        at: before(omarNext, 8 * 60),
        type: "created",
        toStatus: "scheduled",
        toDoctorId: IDS.anika,
        toScheduledAt: omarNext,
      },
    ],
  );

  const priyaPending = iso(pendingDay, "11:00");
  push(
    visit({
      id: "apt-priya-pending",
      reference: "HF-2420",
      patientId: IDS.priya,
      locationId: IDS.andheri,
      departmentId: IDS.andCardio,
      appointmentTypeId: IDS.specialist,
      doctorId: null,
      scheduledAt: priyaPending,
      durationMinutes: 30,
      reason: "Discuss a recent ECG",
      status: "pending",
      cancelReason: null,
      createdBy: IDS.priyaProfile,
      assignedBy: null,
    }),
    [
      {
        actorId: IDS.priyaProfile,
        at: before(priyaPending, 5 * 60),
        type: "created",
        toStatus: "pending",
        toScheduledAt: priyaPending,
        note: "Any available cardiologist",
      },
    ],
  );

  const priyaDone = iso(completedDay, "09:30");
  push(
    visit({
      id: "apt-priya-done",
      reference: "HF-2421",
      patientId: IDS.priya,
      locationId: IDS.andheri,
      departmentId: IDS.andGeneral,
      appointmentTypeId: IDS.followUp,
      doctorId: IDS.anika,
      scheduledAt: priyaDone,
      durationMinutes: 10,
      reason: "Blood pressure check",
      status: "completed",
      cancelReason: null,
      createdBy: IDS.priyaProfile,
      assignedBy: null,
    }),
    [
      {
        actorId: IDS.priyaProfile,
        at: before(priyaDone, 72 * 60),
        type: "created",
        toStatus: "scheduled",
        toDoctorId: IDS.anika,
        toScheduledAt: priyaDone,
      },
      {
        actorId: IDS.anika,
        at: priyaDone,
        type: "status_changed",
        fromStatus: "scheduled",
        toStatus: "in_progress",
      },
      {
        actorId: IDS.anika,
        at: before(priyaDone, -12),
        type: "status_changed",
        fromStatus: "in_progress",
        toStatus: "completed",
      },
    ],
  );

  const priyaCanceledAt = iso(canceledDay, "15:00");
  push(
    visit({
      id: "apt-priya-canceled",
      reference: "HF-2422",
      patientId: IDS.priya,
      locationId: IDS.andheri,
      departmentId: IDS.andGeneral,
      appointmentTypeId: IDS.general,
      doctorId: IDS.anika,
      scheduledAt: priyaCanceledAt,
      durationMinutes: 15,
      reason: "Annual wellness visit",
      status: "canceled",
      cancelReason: "Could not travel that day",
      createdBy: IDS.priyaProfile,
      assignedBy: null,
    }),
    [
      {
        actorId: IDS.priyaProfile,
        at: before(priyaCanceledAt, 96 * 60),
        type: "created",
        toStatus: "scheduled",
        toDoctorId: IDS.anika,
        toScheduledAt: priyaCanceledAt,
      },
      {
        actorId: IDS.priyaProfile,
        at: before(priyaCanceledAt, 30 * 60),
        type: "canceled",
        fromStatus: "scheduled",
        toStatus: "canceled",
        note: "Could not travel that day",
      },
    ],
  );

  const data: ClinicData = {
    organization: { id: IDS.org, name: "HealthFirst Clinic" },
    locations: [
      {
        id: IDS.andheri,
        organizationId: IDS.org,
        name: "Andheri",
        timezone: TZ,
        address: "14, Lokhandwala Road, Andheri West, Mumbai",
      },
      {
        id: IDS.bandra,
        organizationId: IDS.org,
        name: "Bandra",
        timezone: TZ,
        address: "22, Turner Road, Bandra West, Mumbai",
      },
    ],
    departments,
    profiles,
    staffAssignments,
    patients,
    appointmentTypes,
    scheduleTemplates: [
      { id: IDS.template, organizationId: IDS.org, name: "Clinic day" },
    ],
    templateShifts,
    doctorSchedules,
    scheduleExceptions,
    appointments,
    events,
  };

  const issues = auditClinic(data);
  if (issues.length > 0) {
    throw new Error(`Demo data is inconsistent:\n${issues.join("\n")}`);
  }

  return data;
}
