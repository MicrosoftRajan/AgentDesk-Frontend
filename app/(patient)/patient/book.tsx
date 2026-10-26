import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, fonts } from "@/theme";
import {
  describeDate,
  formatClinicTime,
  shiftDate,
  todayInClinic,
} from "@/features/appointments";
import { useAuth } from "@/features/auth";
import { BOOKING_WINDOW_DAYS, useSlots } from "@/features/patients";
import { bookAppointment } from "@/services/api/patients";

const MAX_REASON_LENGTH = 200;

export default function BookAppointmentScreen() {
  const { account } = useAuth();

  const [date, setDate] = useState(todayInClinic);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const { data, isLoading, errorMessage, reload } = useSlots(date);

  const days = useMemo(() => {
    const today = todayInClinic();

    return Array.from({ length: BOOKING_WINDOW_DAYS + 1 }, (_, index) =>
      shiftDate(today, index),
    );
  }, []);

  const hasProfile = Boolean(account?.fullName && account?.phone);

  // Slots in state may belong to a day we have since moved away from.
  const slots = useMemo(
    () => (data?.date === date ? data.slots : []),
    [data, date],
  );
  const showSpinner = isLoading && data?.date !== date;
  const activeSlot = slots.some((slot) => slot.startsAt === selectedSlot)
    ? selectedSlot
    : null;

  const selectDay = (day: string) => {
    setDate(day);
    setSelectedSlot(null);
    setBookingError(null);
  };

  const handleBook = async () => {
    if (!activeSlot || isBooking) {
      return;
    }

    setIsBooking(true);
    setBookingError(null);

    try {
      const trimmedReason = reason.trim();

      await bookAppointment({
        scheduledAt: activeSlot,
        ...(trimmedReason ? { reason: trimmedReason } : {}),
      });

      router.replace("/patient/appointments");
    } catch (error) {
      setBookingError(
        error instanceof Error ? error.message : "Could not book that time.",
      );
      // The slot may have just been taken: refresh what is available.
      setSelectedSlot(null);
      reload();
    } finally {
      setIsBooking(false);
    }
  };

  if (!hasProfile) {
    return (
      <Screen>
        <View style={styles.gate}>
          <Text style={styles.gateTitle}>One quick step first</Text>
          <Text style={styles.gateText}>
            Add your name and phone number so the clinic can reach you about
            your appointment.
          </Text>
          <AppButton
            label="Add my details"
            onPress={() => router.push("/patient/profile")}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Choose a day</Text>

          <ScrollView
            contentContainerStyle={styles.dayRow}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {days.map((day) => {
              const isSelected = day === date;

              return (
                <Pressable
                  accessibilityLabel={describeDate(day)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={day}
                  onPress={() => selectDay(day)}
                  style={[styles.day, isSelected && styles.daySelected]}
                >
                  <Text
                    style={[styles.dayText, isSelected && styles.dayTextSelected]}
                  >
                    {describeDate(day)}
                  </Text>
                  <Text
                    style={[styles.daySub, isSelected && styles.dayTextSelected]}
                  >
                    {day.slice(8)}/{day.slice(5, 7)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.sectionTitle}>Choose a time</Text>

          {showSpinner ? (
            <ActivityIndicator color={colors.primary} style={styles.spinner} />
          ) : errorMessage && !data ? (
            <View style={styles.messageBlock}>
              <Text accessibilityRole="alert" style={styles.error}>
                {errorMessage}
              </Text>
              <AppButton label="Retry" onPress={reload} variant="secondary" />
            </View>
          ) : data && !data.isOpen ? (
            <Text style={styles.empty}>
              The clinic is closed on this day. Please pick another.
            </Text>
          ) : slots.length === 0 ? (
            <Text style={styles.empty}>
              No times left on this day. Please pick another.
            </Text>
          ) : (
            <View style={styles.slotGrid}>
              {slots.map((slot) => {
                const isSelected = slot.startsAt === activeSlot;

                return (
                  <Pressable
                    accessibilityLabel={formatClinicTime(slot.startsAt)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    key={slot.startsAt}
                    onPress={() => {
                      setSelectedSlot(slot.startsAt);
                      setBookingError(null);
                    }}
                    style={[styles.slot, isSelected && styles.slotSelected]}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        isSelected && styles.slotTextSelected,
                      ]}
                    >
                      {formatClinicTime(slot.startsAt)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <Text style={styles.sectionTitle}>Reason (optional)</Text>

          <TextInput
            accessibilityLabel="Reason for visit"
            editable={!isBooking}
            maxLength={MAX_REASON_LENGTH}
            onChangeText={setReason}
            placeholder="e.g. follow-up visit"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={reason}
          />
          <Text style={styles.hint}>
            Please don&apos;t include medical details here.
          </Text>

          {bookingError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {bookingError}
            </Text>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <AppButton
            label={
              isBooking
                ? "Booking..."
                : activeSlot
                  ? `Book ${describeDate(date)} at ${formatClinicTime(activeSlot)}`
                  : "Select a time"
            }
            onPress={handleBook}
            disabled={!activeSlot || isBooking}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  content: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },

  gate: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.md,
  },

  gateTitle: {
    color: colors.text,
    fontSize: 24,
    fontFamily: fonts.display,
  },

  gateText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontFamily: fonts.body,
    lineHeight: 24,
  },

  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.heading,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: spacing.sm,
  },

  dayRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },

  day: {
    minWidth: 84,
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },

  daySelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  dayText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.heading,
  },

  daySub: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.body,
    marginTop: 2,
  },

  dayTextSelected: {
    color: colors.text,
  },

  spinner: {
    marginVertical: spacing.lg,
  },

  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  slot: {
    minWidth: 92,
    alignItems: "center",
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },

  slotSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  slotText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.semibold,
  },

  slotTextSelected: {
    fontFamily: fonts.display,
  },

  messageBlock: {
    gap: spacing.md,
    alignItems: "center",
  },

  empty: {
    color: colors.textSecondary,
    fontSize: 15,
    fontFamily: fonts.body,
    lineHeight: 22,
    paddingVertical: spacing.md,
  },

  input: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.body,
  },

  hint: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.body,
  },

  error: {
    color: colors.danger,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 20,
  },

  footer: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
});
