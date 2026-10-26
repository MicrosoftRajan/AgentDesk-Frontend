import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, fonts } from "../../../theme";
import type { AgentRunStatus } from "../types";

interface AgentStatusProps {
  status: AgentRunStatus;
}

const STATUS_CONFIG: Record<
  AgentRunStatus,
  { label: string; color: string }
> = {
  idle: { label: "Idle", color: colors.textMuted },
  pending: { label: "Pending", color: colors.warning },
  running: { label: "Agent running", color: colors.accent },
  awaiting_approval: { label: "Waiting for your approval", color: colors.warning },
  completed: { label: "Completed", color: colors.success },
  failed: { label: "Failed", color: colors.danger },
  cancelled: { label: "Cancelled", color: colors.textSecondary },
};

export function AgentStatus({ status }: AgentStatusProps) {
  const config = STATUS_CONFIG[status];

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
      accessibilityLabel={`Status: ${config.label}`}
      style={styles.container}
    >
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  label: {
    fontSize: 14,
    fontFamily: fonts.semibold,
  },
});
