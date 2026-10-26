import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, fonts } from "@/theme";
import { ApprovalCard } from "@/features/ai-agent";
import {
  RunStatusBadge,
  formatRunDate,
  useAgentRunDetails,
} from "@/features/history";
import {
  approveAgentRun,
  rejectAgentRun,
  type AgentMessageRole,
} from "@/services/api/agents";

const ROLE_LABELS: Record<AgentMessageRole, string> = {
  user: "You",
  assistant: "Assistant",
  tool: "Tool",
  system: "System",
};

export default function RunDetailsScreen() {
  const { runId } = useLocalSearchParams<{ runId: string }>();
  const { data, isLoading, errorMessage, reload } = useAgentRunDetails(
    typeof runId === "string" ? runId : "",
  );
  const [isDeciding, setIsDeciding] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const decide = async (decision: "approve" | "reject") => {
    if (typeof runId !== "string" || isDeciding) {
      return;
    }

    setIsDeciding(true);
    setDecisionError(null);

    try {
      await (decision === "approve"
        ? approveAgentRun(runId)
        : rejectAgentRun(runId));
    } catch (error) {
      setDecisionError(
        error instanceof Error && error.message.length > 0
          ? error.message
          : "Could not send your decision. Try again.",
      );
    } finally {
      setIsDeciding(false);
      // Re-read the real state (it may have expired or already resolved).
      reload();
    }
  };

  if (isLoading && !data) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text accessibilityRole="alert" style={styles.error}>
            {errorMessage ?? "Run not found."}
          </Text>
          <AppButton label="Retry" onPress={reload} variant="secondary" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.goal}>{data.goal}</Text>

        <View style={styles.meta}>
          <RunStatusBadge status={data.status} />
          <Text style={styles.date}>{formatRunDate(data.createdAt)}</Text>
        </View>

        {data.status === "awaiting_approval" && data.pendingApproval ? (
          <ApprovalCard
            approval={data.pendingApproval}
            isSubmitting={isDeciding}
            onApprove={() => decide("approve")}
            onReject={() => decide("reject")}
          />
        ) : null}

        {decisionError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {decisionError}
          </Text>
        ) : null}

        <Text style={styles.sectionLabel}>Conversation</Text>

        {data.messages.length === 0 ? (
          <Text style={styles.muted}>No messages were recorded for this run.</Text>
        ) : (
          data.messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.message,
                message.role === "user" && styles.userMessage,
                message.role === "tool" && styles.toolMessage,
              ]}
            >
              <Text style={styles.role}>{ROLE_LABELS[message.role]}</Text>
              <Text
                selectable
                style={[
                  styles.messageBody,
                  message.role === "tool" && styles.mono,
                ]}
              >
                {message.content}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },

  content: {
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },

  goal: {
    color: colors.text,
    fontSize: 22,
    fontFamily: fonts.display,
    lineHeight: 30,
  },

  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },

  date: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.body,
  },

  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.heading,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: spacing.sm,
  },

  message: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  userMessage: {
    backgroundColor: colors.background,
  },

  toolMessage: {
    borderStyle: "dashed",
  },

  role: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.heading,
    letterSpacing: 0.5,
  },

  messageBody: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.body,
    lineHeight: 22,
  },

  mono: {
    fontFamily: "Courier",
    fontSize: 13,
    lineHeight: 19,
  },

  muted: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.body,
  },

  error: {
    color: colors.danger,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 20,
    textAlign: "center",
  },
});
