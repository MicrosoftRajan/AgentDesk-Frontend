import { StyleSheet, Text } from "react-native";
import Animated, { FadeInLeft } from "react-native-reanimated";

import { colors, radius, spacing, fonts } from "../../../theme";
import type { AgentStep, AgentStepStatus } from "../types";

interface ExecutionStepProps {
  step: AgentStep;
}

const STATUS_COLOR: Record<AgentStepStatus, string> = {
  pending: colors.textMuted,
  running: colors.accent,
  completed: colors.success,
  failed: colors.danger,
  skipped: colors.textMuted,
};

const STATUS_ICON: Record<AgentStepStatus, string> = {
  pending: "○",
  running: "◉",
  completed: "●",
  failed: "✕",
  skipped: "–",
};

const STATUS_LABEL: Record<AgentStepStatus, string> = {
  pending: "pending",
  running: "running",
  completed: "completed",
  failed: "failed",
  skipped: "skipped",
};

export function ExecutionStep({ step }: ExecutionStepProps) {
  const color = STATUS_COLOR[step.status];

  return (
    <Animated.View
      accessibilityRole="text"
      accessibilityLabel={`${step.label}, ${STATUS_LABEL[step.status]}`}
      entering={FadeInLeft.springify().damping(16)}
      style={styles.container}
    >
      <Text style={[styles.icon, { color }]} importantForAccessibility="no">
        {STATUS_ICON[step.status]}
      </Text>
      <Text
        style={[
          styles.label,
          step.status === "completed" && styles.labelCompleted,
          step.status === "failed" && styles.labelFailed,
          step.status === "skipped" && styles.labelSkipped,
        ]}
      >
        {step.label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },

  icon: {
    fontSize: 14,
    fontFamily: fonts.body,
    width: 16,
    textAlign: "center",
  },

  label: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.text,
  },

  labelCompleted: {
    color: colors.textSecondary,
  },

  labelFailed: {
    color: colors.danger,
  },

  labelSkipped: {
    color: colors.textMuted,
  },
});
