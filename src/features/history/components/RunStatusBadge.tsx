import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, fonts } from "../../../theme";
import type { AgentRunApiStatus } from "../../../services/api/agents";

const CONFIG: Record<AgentRunApiStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: colors.warning },
  running: { label: "Running", color: colors.accent },
  awaiting_approval: { label: "Needs approval", color: colors.warning },
  completed: { label: "Completed", color: colors.success },
  failed: { label: "Failed", color: colors.danger },
  cancelled: { label: "Cancelled", color: colors.textSecondary },
};

export function RunStatusBadge({ status }: { status: AgentRunApiStatus }) {
  const config = CONFIG[status] ?? CONFIG.pending;

  return (
    <View
      accessibilityLabel={`Status: ${config.label}`}
      accessibilityRole="text"
      style={styles.container}
    >
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }]}>
        {config.label}
      </Text>
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
    fontSize: 13,
    fontFamily: fonts.semibold,
  },
});
