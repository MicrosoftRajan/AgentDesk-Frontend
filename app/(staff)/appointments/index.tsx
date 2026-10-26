import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, fonts } from "@/theme";
import {
  AppointmentStatusBadge,
  describeDate,
  formatClinicTime,
  shiftDate,
  todayInClinic,
  useAppointments,
} from "@/features/appointments";
import type { AppointmentResponse } from "@/services/api/appointments";

function AppointmentCard({ item }: { item: AppointmentResponse }) {
  const isInactive = item.status === "cancelled";

  return (
    <View style={[styles.card, isInactive && styles.cardInactive]}>
      <View style={styles.timeColumn}>
        <Text style={styles.time}>{formatClinicTime(item.scheduledAt)}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text numberOfLines={1} style={styles.name}>
            {item.patientName}
          </Text>
          <AppointmentStatusBadge status={item.status} />
        </View>

        <Text style={styles.phone}>{item.patientPhone}</Text>

        {item.reason ? (
          <Text numberOfLines={2} style={styles.reason}>
            {item.reason}
          </Text>
        ) : null}

        {item.status === "cancelled" && item.cancelReason ? (
          <Text numberOfLines={2} style={styles.cancelReason}>
            Cancelled: {item.cancelReason}
          </Text>
        ) : null}

        {item.lastReminderAt ? (
          <Text style={styles.reminder}>
            Reminder sent ·{" "}
            {formatClinicTime(item.lastReminderAt)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function AppointmentsScreen() {
  const [date, setDate] = useState(todayInClinic);
  const { data, isLoading, errorMessage, reload } = useAppointments(date);

  // Refresh when coming back from the agent screen, where
  // appointments may have been booked or changed.
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }

      reload();
    }, [reload]),
  );

  const appointments = useMemo(
    () => (data?.date === date ? data.appointments : []),
    [data, date],
  );

  const counts = useMemo(() => {
    const active = appointments.filter((a) => a.status !== "cancelled");

    return {
      total: active.length,
      noShow: appointments.filter((a) => a.status === "no_show").length,
      cancelled: appointments.length - active.length,
    };
  }, [appointments]);

  const isToday = date === todayInClinic();
  const showSpinner = isLoading && data?.date !== date;

  return (
    <Screen>
      <View style={styles.dayBar}>
        <Pressable
          accessibilityLabel="Previous day"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setDate((current) => shiftDate(current, -1))}
          style={styles.arrow}
        >
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Jump to today"
          accessibilityRole="button"
          disabled={isToday}
          onPress={() => setDate(todayInClinic())}
          style={styles.dayLabelWrap}
        >
          <Text style={styles.dayLabel}>{describeDate(date)}</Text>
          <Text style={styles.daySub}>
            {isToday ? date : `${date} · tap for today`}
          </Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Next day"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setDate((current) => shiftDate(current, 1))}
          style={styles.arrow}
        >
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {counts.total} appointment{counts.total === 1 ? "" : "s"}
          {counts.noShow ? ` · ${counts.noShow} no-show` : ""}
          {counts.cancelled ? ` · ${counts.cancelled} cancelled` : ""}
        </Text>
      </View>

      {showSpinner ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : errorMessage && !data ? (
        <View style={styles.center}>
          <Text accessibilityRole="alert" style={styles.error}>
            {errorMessage}
          </Text>
          <AppButton label="Retry" onPress={reload} variant="secondary" />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={appointments}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No appointments for this day. Ask the agent to book one.
            </Text>
          }
          onRefresh={reload}
          refreshing={isLoading}
          renderItem={({ item }) => <AppointmentCard item={item} />}
        />
      )}

      <View style={styles.footer}>
        <AppButton
          label="Ask the agent"
          onPress={() => router.push("/agent")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dayBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.md,
  },

  arrow: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  arrowText: {
    color: colors.text,
    fontSize: 26,
    fontFamily: fonts.body,
    lineHeight: 30,
  },

  dayLabelWrap: {
    alignItems: "center",
  },

  dayLabel: {
    color: colors.text,
    fontSize: 22,
    fontFamily: fonts.display,
  },

  daySub: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.body,
    marginTop: 2,
  },

  summary: {
    paddingVertical: spacing.md,
  },

  summaryText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.semibold,
    textAlign: "center",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },

  list: {
    flexGrow: 1,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },

  card: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardInactive: {
    opacity: 0.55,
  },

  timeColumn: {
    width: 68,
  },

  time: {
    color: colors.primaryLight,
    fontSize: 15,
    fontFamily: fonts.heading,
  },

  cardBody: {
    flex: 1,
    gap: 2,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  name: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.heading,
  },

  phone: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.body,
  },

  reason: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 20,
    marginTop: spacing.xs,
  },

  cancelReason: {
    color: colors.danger,
    fontSize: 13,
    fontFamily: fonts.body,
    marginTop: spacing.xs,
  },

  reminder: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.body,
    marginTop: spacing.xs,
  },

  empty: {
    color: colors.textSecondary,
    fontSize: 15,
    fontFamily: fonts.body,
    lineHeight: 22,
    textAlign: "center",
    marginTop: spacing.xxl,
  },

  error: {
    color: colors.danger,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 20,
    textAlign: "center",
  },

  footer: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
});
