import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { doctorsForSlot, getAvailableSlots, profileOf } from "../availability";
import { patientIsBusy } from "../operations";
import {
  presentAppointment,
  type AppointmentView,
} from "../selectors";
import { usePrototype } from "../store";
import { addDays, clinicDateString, formatDateLabel, formatTimeLabel } from "../time";
import type { Appointment, DemoRole } from "../types";
import { Button, Card, Chip, Dialog, Field, Meta, SectionTitle, StatusBadge } from "./primitives";
import { desk, space, type } from "./tokens";

export function AppointmentCard({
  view,
  onPress,
}: {
  view: AppointmentView;
  onPress?: () => void;
}) {
  return (
    <Card onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>{view.patientName}</Text>
          <Meta>
            {view.reference} · {view.serviceName} · {view.durationMinutes} min
          </Meta>
        </View>
        <StatusBadge status={view.appointment.status} />
      </View>
      <Text style={styles.when}>{view.when}</Text>
      <Meta>{view.locationLine}</Meta>
      <Meta>{view.departmentName}</Meta>
      <Text style={styles.doctor}>{view.unassigned ? "Awaiting doctor assignment" : view.doctorName}</Text>
    </Card>
  );
}

export function ActivityTimeline({ appointmentId }: { appointmentId: string }) {
  const { data } = usePrototype();
  const events = data.events
    .filter((item) => item.appointmentId === appointmentId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return (
    <View style={styles.stack}>
      <SectionTitle>Activity</SectionTitle>
      <Meta>Stored only in this browser for the prototype.</Meta>
      {events.map((item) => {
        const actor = profileOf(data, item.actorId)?.fullName ?? "System";
        return (
          <View key={item.id} style={styles.event}>
            <Text style={styles.cardTitle}>{item.eventType.replaceAll("_", " ")}</Text>
            <Meta>
              {actor} · {new Date(item.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
            </Meta>
            {item.fromStatus || item.toStatus ? (
              <Meta>
                Status {item.fromStatus ?? "—"} → {item.toStatus ?? "—"}
              </Meta>
            ) : null}
            {item.fromScheduledAt || item.toScheduledAt ? (
              <Meta>
                Time {item.fromScheduledAt ? new Date(item.fromScheduledAt).toLocaleString("en-IN") : "—"} →{" "}
                {item.toScheduledAt ? new Date(item.toScheduledAt).toLocaleString("en-IN") : "—"}
              </Meta>
            ) : null}
            {item.note ? <Text style={styles.body}>{item.note}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

export function VisitDetail({
  appointmentId,
  role,
}: {
  appointmentId: string;
  role: DemoRole;
}) {
  const api = usePrototype();
  const appointment = api.data.appointments.find((item) => item.id === appointmentId);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [moveOpen, setMoveOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | "start" | "complete" | "noshow" | "checkin">(null);

  if (!appointment) {
    return <Meta>This appointment is not in the demo clinic.</Meta>;
  }
  const view = presentAppointment(api.data, appointment);
  const canCancel = appointment.status === "pending" || appointment.status === "scheduled";
  const canMove = canCancel;
  const canAssign = role === "staff" && appointment.status === "pending" && !appointment.doctorId;
  const canCheckIn = role === "staff" && appointment.status === "scheduled";
  const canStart = role === "doctor" && appointment.status === "scheduled";
  const canComplete = role === "doctor" && appointment.status === "in_progress";
  const canNoShow = role === "staff" && appointment.status === "scheduled";

  return (
    <View style={styles.stack}>
      <Card>
        <View style={styles.cardTop}>
          <View style={styles.flex}>
            <Text style={styles.kicker}>{view.reference}</Text>
            <Text style={styles.cardTitle}>{view.patientName}</Text>
            <Meta>{view.patientPhone || "No phone on file"}</Meta>
          </View>
          <StatusBadge status={appointment.status} />
        </View>
        <Info label="When" value={`${view.when} · ${view.durationMinutes} min`} />
        <Info label="Branch" value={`${view.locationLine}\n${view.address}`} />
        <Info label="Department" value={view.departmentName} />
        <Info label="Service" value={view.serviceName} />
        <Info label="Doctor" value={view.unassigned ? "Awaiting assignment" : view.doctorName} />
        <Info label="Reason" value={appointment.reason ?? "No reason given"} />
        {appointment.cancelReason ? <Info label="Cancellation" value={appointment.cancelReason} /> : null}
        <Meta>Times shown in {view.timezone}.</Meta>
      </Card>

      <View style={styles.actions}>
        {canAssign ? <Button label="Assign doctor" onPress={() => setAssignOpen(true)} /> : null}
        {canMove ? <Button label="Reschedule" onPress={() => setMoveOpen(true)} variant="secondary" /> : null}
        {canCheckIn ? (
          <Button label="Register arrival" onPress={() => setConfirm("checkin")} variant="secondary" />
        ) : null}
        {canStart ? <Button label="Start visit" onPress={() => setConfirm("start")} /> : null}
        {canComplete ? <Button label="Complete visit" onPress={() => setConfirm("complete")} /> : null}
        {canNoShow ? (
          <Button label="Mark no-show" onPress={() => setConfirm("noshow")} variant="danger" />
        ) : null}
        {canCancel ? (
          <Button label="Cancel visit" onPress={() => setCancelOpen(true)} variant="danger" />
        ) : null}
      </View>

      <ActivityTimeline appointmentId={appointment.id} />

      <Dialog onClose={() => setCancelOpen(false)} title="Cancel this visit" visible={cancelOpen}>
        <Meta>The appointment record stays in history. This does not delete it.</Meta>
        <Field label="Reason" onChangeText={setReason} value={reason} />
        <Button
          label="Confirm cancellation"
          onPress={() => {
            const result = api.cancelAppointment(appointment.id, reason);
            if (result.ok) {
              setCancelOpen(false);
              setReason("");
            }
          }}
          variant="danger"
        />
      </Dialog>

      <RescheduleDialog
        appointment={appointment}
        onClose={() => setMoveOpen(false)}
        visible={moveOpen}
      />
      <AssignDialog
        appointment={appointment}
        onClose={() => setAssignOpen(false)}
        visible={assignOpen}
      />
      <Dialog
        onClose={() => setConfirm(null)}
        title={
          confirm === "complete"
            ? "Complete visit"
            : confirm === "noshow"
              ? "Mark no-show"
              : confirm === "checkin"
                ? "Simulated arrival"
                : "Start visit"
        }
        visible={confirm !== null}
      >
        <Meta>
          {confirm === "checkin"
            ? "This demo marks the visit in progress without a camera or a verified QR token."
            : confirm === "noshow"
              ? "Use this only when the patient did not attend. The status becomes incomplete."
              : "This updates the same appointment and writes a local activity event."}
        </Meta>
        <Button
          label="Confirm"
          onPress={() => {
            if (confirm === "start" || confirm === "checkin") {
              api.updateAppointmentStatus(
                appointment.id,
                "in_progress",
                confirm === "checkin"
                  ? "Simulated front-desk arrival. Camera and token checks were not used."
                  : "Doctor started the visit",
              );
            } else if (confirm === "complete") {
              api.updateAppointmentStatus(appointment.id, "completed", "Doctor completed the visit");
            } else if (confirm === "noshow") {
              api.updateAppointmentStatus(appointment.id, "incomplete", "Patient did not attend");
            }
            setConfirm(null);
          }}
        />
      </Dialog>
    </View>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Text style={styles.kicker}>{label}</Text>
      <Text style={styles.body}>{value}</Text>
    </View>
  );
}

function RescheduleDialog({
  appointment,
  visible,
  onClose,
}: {
  appointment: Appointment;
  visible: boolean;
  onClose: () => void;
}) {
  const api = usePrototype();
  const location = api.data.locations.find((item) => item.id === appointment.locationId);
  const timezone = location?.timezone ?? "Asia/Kolkata";
  const today = clinicDateString(new Date(), timezone);
  const days = useMemo(
    () => Array.from({ length: 14 }, (_, index) => addDays(today, index)),
    [today],
  );
  const [date, setDate] = useState(days[1] ?? today);
  const slots = getAvailableSlots(api.data, {
    locationId: appointment.locationId,
    departmentId: appointment.departmentId,
    durationMinutes: appointment.durationMinutes,
    date,
    doctorId: appointment.doctorId,
    ignoreAppointmentId: appointment.id,
  }).filter(
    (slot) =>
      !patientIsBusy(
        api.data,
        appointment.patientId,
        slot.scheduledAt,
        appointment.durationMinutes,
        appointment.id,
      ),
  );

  return (
    <Dialog onClose={onClose} title={`Reschedule ${appointment.reference}`} visible={visible}>
      <Meta>
        {appointment.doctorId
          ? "Only times this doctor can still cover are shown."
          : "Times with at least one free doctor at this branch are shown."}
      </Meta>
      <View style={styles.wrap}>
        {days.map((day) => (
          <Chip
            key={day}
            label={formatDateLabel(day, timezone).replace(/,?\s*\d{4}/, "")}
            onPress={() => setDate(day)}
            selected={day === date}
          />
        ))}
      </View>
      <View style={styles.wrap}>
        {slots.length === 0 ? <Meta>No open time on this date.</Meta> : null}
        {slots.map((slot) => (
          <Chip
            key={slot.scheduledAt}
            label={formatTimeLabel(slot.startTime)}
            onPress={() => {
              const result = api.rescheduleAppointment(appointment.id, date, slot.startTime);
              if (result.ok) {
                onClose();
              }
            }}
          />
        ))}
      </View>
    </Dialog>
  );
}

function AssignDialog({
  appointment,
  visible,
  onClose,
}: {
  appointment: Appointment;
  visible: boolean;
  onClose: () => void;
}) {
  const api = usePrototype();
  const fits = doctorsForSlot(api.data, appointment);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const selected = fits.find((item) => item.doctor.id === doctorId);

  return (
    <Dialog onClose={onClose} title="Assign a doctor" visible={visible}>
      <Meta>
        {appointment.reference} stays the same record. Only doctors assigned to this branch and
        department are listed.
      </Meta>
      {fits.map((fit) => (
        <Card key={fit.doctor.id} onPress={fit.ok ? () => setDoctorId(fit.doctor.id) : undefined}>
          <View style={styles.cardTop}>
            <Text style={styles.cardTitle}>{fit.doctor.fullName}</Text>
            <Text style={[styles.body, { color: fit.ok ? desk.success : desk.danger }]}>
              {fit.ok ? "Available" : "Unavailable"}
            </Text>
          </View>
          <Meta>{fit.reason}</Meta>
          {doctorId === fit.doctor.id ? <Meta>Selected</Meta> : null}
        </Card>
      ))}
      <Button
        disabled={!selected?.ok}
        label="Confirm assignment"
        onPress={() => {
          if (!doctorId) {
            return;
          }
          const result = api.assignDoctor(appointment.id, doctorId);
          if (result.ok) {
            onClose();
          }
        }}
      />
    </Dialog>
  );
}

export function QrMark({ value }: { value: string }) {
  const cells = useMemo(() => {
    const size = 13;
    const bits: boolean[] = [];
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash * 33 + value.charCodeAt(i)) >>> 0;
    }
    for (let i = 0; i < size * size; i += 1) {
      hash = (hash * 1664525 + 1013904223) >>> 0;
      const edge = i < size || i % size === 0 || i >= size * (size - 1) || i % size === size - 1;
      const finder =
        (i < size * 3 && i % size < 3) ||
        (i < size * 3 && i % size > size - 4) ||
        (i >= size * (size - 3) && i % size < 3);
      bits.push(finder || edge || hash % 3 !== 0);
    }
    return bits;
  }, [value]);

  return (
    <View style={styles.qr}>
      {cells.map((on, index) => (
        <View key={index} style={[styles.cell, on ? styles.cellOn : null]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space.md },
  flex: { flex: 1, gap: 2 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: space.sm },
  cardTitle: { color: desk.text, fontFamily: type.semibold, fontSize: 16 },
  when: { color: desk.text, fontFamily: type.medium, fontSize: 14 },
  doctor: { color: desk.primary, fontFamily: type.medium, fontSize: 14 },
  kicker: {
    color: desk.muted,
    fontFamily: type.medium,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  body: { color: desk.text, fontFamily: type.body, fontSize: 15, lineHeight: 22 },
  info: { gap: 2 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  event: {
    backgroundColor: desk.surface,
    borderWidth: 1,
    borderColor: desk.border,
    borderRadius: 12,
    padding: space.md,
    gap: 4,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  qr: {
    width: 182,
    height: 182,
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#fff",
    padding: 8,
    borderWidth: 1,
    borderColor: desk.border,
    borderRadius: 12,
  },
  cell: { width: 12, height: 12, backgroundColor: "#fff" },
  cellOn: { backgroundColor: desk.text },
});
