import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "../../components/ui/AppButton";
import { Card } from "../../components/ui/Card";
import { colors, spacing, fonts } from "../../theme";
import {
  cancelMyAppointment,
  type PatientAppointment,
} from "../../services/api/patients";
import {
  AppointmentStatusBadge,
  clinicDateOf,
  describeDate,
  formatClinicTime,
} from "../appointments";

import { isUpcoming } from "./appointments";

interface Props {
  appointment: PatientAppointment;
  /** When given, upcoming appointments show a cancel option. */
  onCancelled?: () => void;
  /** Position in a list; staggers the entrance animation. */
  index?: number;
}

export function PatientAppointmentCard({
  appointment,
  onCancelled,
  index = 0,
}: Props) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canCancel = Boolean(onCancelled) && isUpcoming(appointment);
  const isInactive = appointment.status === "cancelled";

  const handleCancel = async () => {
    if (isCancelling) {
      return;
    }

    setIsCancelling(true);
    setErrorMessage(null);

    try {
      await cancelMyAppointment(appointment.id);
      onCancelled?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not cancel.",
      );
      setIsConfirming(false);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Card index={index} style={isInactive ? styles.cardInactive : undefined}>
      <View style={styles.header}>
        <View style={styles.when}>
          <Text style={styles.date}>
            {describeDate(clinicDateOf(appointment.scheduledAt))}
          </Text>
          <Text style={styles.time}>
            {formatClinicTime(appointment.scheduledAt)}
          </Text>
        </View>

        <AppointmentStatusBadge status={appointment.status} />
      </View>

      {appointment.reason ? (
        <Text numberOfLines={2} style={styles.reason}>
          {appointment.reason}
        </Text>
      ) : null}

      {appointment.status === "cancelled" && appointment.cancelReason ? (
        <Text numberOfLines={2} style={styles.cancelReason}>
          {appointment.cancelReason}
        </Text>
      ) : null}

      {errorMessage ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {errorMessage}
        </Text>
      ) : null}

      {canCancel ? (
        isConfirming ? (
          <View style={styles.confirm}>
            <Text style={styles.confirmText}>
              Cancel this appointment? This cannot be undone.
            </Text>
            <AppButton
              label={isCancelling ? "Cancelling..." : "Yes, cancel it"}
              onPress={handleCancel}
              disabled={isCancelling}
            />
            <AppButton
              label="Keep appointment"
              onPress={() => setIsConfirming(false)}
              disabled={isCancelling}
              variant="secondary"
            />
          </View>
        ) : (
          <AppButton
            label="Cancel appointment"
            onPress={() => setIsConfirming(true)}
            variant="secondary"
          />
        )
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  cardInactive: {
    opacity: 0.6,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  when: {
    flex: 1,
    gap: 2,
  },

  date: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.display,
  },

  time: {
    color: colors.primaryLight,
    fontSize: 15,
    fontFamily: fonts.heading,
  },

  reason: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 20,
  },

  cancelReason: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.body,
  },

  error: {
    color: colors.danger,
    fontSize: 13,
    fontFamily: fonts.body,
    lineHeight: 18,
  },

  confirm: {
    gap: spacing.sm,
  },

  confirmText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 20,
  },
});
