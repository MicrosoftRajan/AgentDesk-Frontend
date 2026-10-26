import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, fonts } from "../../theme";
import type { AppointmentApiStatus } from "../../services/api/appointments";

const CONFIG: Record<
  AppointmentApiStatus,
  { label: string; color: string }
> = {
  scheduled: { label: "Scheduled", color: colors.accent },
  completed: { label: "Completed", color: colors.success },
  no_show: { label: "No-show", color: colors.warning },
  cancelled: { label: "Cancelled", color: colors.danger },
};

export function AppointmentStatusBadge({
  status,
}: {
  status: AppointmentApiStatus;
}) {
  const config = CONFIG[status] ?? CONFIG.scheduled;

  return (
    <View
      accessibilityLabel={`Status: ${config.label}`}
      accessibilityRole="text"
      style={[styles.badge, { borderColor: config.color }]}
    >
      <Text style={[styles.label, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
  },

  label: {
    fontSize: 12,
    fontFamily: fonts.heading,
  },
});
