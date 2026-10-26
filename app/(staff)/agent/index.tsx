import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { AppButton } from "@/components/ui/AppButton";
import { AnimatedWelcomeText } from "@/components/ui/AnimatedWelcomeText";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, fonts } from "@/theme";
import {
  AgentStatus,
  AgentThinking,
  ApprovalCard,
  ExecutionStep,
  GoalInput,
  useAgent,
} from "@/features/ai-agent";
import type { AgentRunStatus } from "@/features/ai-agent";

const SUGGESTIONS = [
  "Show today's appointments",
  "Book Ravi Kumar (+919876543210) tomorrow at 4 pm for a follow-up",
  "Send reminders for tomorrow's appointments",
  "Mark today's missed appointments as no-show and send follow-ups",
  "Cancel Ravi Kumar's appointment, patient is unwell",
] as const;

function actionLabel(status: AgentRunStatus): string {
  switch (status) {
    case "pending":
    case "running":
      return "Cancel";
    case "completed":
      return "Run again";
    case "failed":
      return "Try again";
    default:
      return "Run agent";
  }
}

export default function AgentScreen() {
  const {
    goal,
    setGoal,
    status,
    steps,
    result,
    errorMessage,
    goalMessage,
    canRun,
    isRunning,
    approval,
    isAwaitingApproval,
    isDeciding,
    approve,
    reject,
    runAgent,
    cancelAgent,
  } = useAgent();

  const showExecution = status !== "idle";

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.flex}
        >
          <AnimatedWelcomeText
            highlight={["do?"]}
            style={styles.title}
            text="What should I do?"
          />
          <Animated.Text
            entering={FadeInDown.delay(450).springify()}
            style={styles.description}
          >
            Tell the front-desk agent what you need, in plain words.
          </Animated.Text>

          <GoalInput
            editable={!isRunning && !isAwaitingApproval}
            errorMessage={isRunning || isAwaitingApproval ? null : goalMessage}
            onChangeText={setGoal}
            value={goal}
          />

          {status === "idle" && goal.trim().length === 0 ? (
            <View style={styles.suggestions}>
              <Text style={styles.suggestionsLabel}>Try one of these</Text>
              {SUGGESTIONS.map((suggestion, index) => (
                <Card
                  accessibilityLabel={`Use suggestion: ${suggestion}`}
                  index={index + 2}
                  key={suggestion}
                  onPress={() => setGoal(suggestion)}
                  style={styles.chip}
                >
                  <Text style={styles.chipText}>{suggestion}</Text>
                </Card>
              ))}
            </View>
          ) : null}

          {showExecution ? (
            <View style={styles.execution}>
              <AgentStatus status={status} />

              <View style={styles.steps}>
                {steps.map((step) => (
                  <ExecutionStep key={step.id} step={step} />
                ))}
              </View>

              {isRunning ? (
                <AgentThinking
                  label={steps.length > 0 ? "Working on it" : "Thinking"}
                />
              ) : null}

              {isAwaitingApproval && approval ? (
                <ApprovalCard
                  approval={approval}
                  isSubmitting={isDeciding}
                  onApprove={approve}
                  onReject={reject}
                />
              ) : null}

              {result ? (
                <Card tone={colors.success}>
                  <Text style={styles.resultLabel}>Result</Text>
                  <Text style={styles.resultBody}>{result}</Text>
                </Card>
              ) : null}

              {errorMessage ? (
                <Text accessibilityRole="alert" style={styles.error}>
                  {errorMessage}
                </Text>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        {isAwaitingApproval ? null : (
          <View style={styles.footer}>
            <AppButton
              accessibilityLabel={isRunning ? "Cancel agent run" : actionLabel(status)}
              disabled={!isRunning && !canRun}
              label={actionLabel(status)}
              onPress={isRunning ? cancelAgent : runAgent}
              variant={isRunning ? "secondary" : "primary"}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    gap: spacing.sm,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },

  title: {
    fontSize: 28,
    lineHeight: 36,
  },

  description: {
    color: colors.textSecondary,
    fontSize: 16,
    fontFamily: fonts.body,
    lineHeight: 24,
    marginBottom: spacing.md,
  },

  suggestions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  suggestionsLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.heading,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  chip: {
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    shadowOpacity: 0,
    elevation: 0,
  },

  chipText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 20,
  },

  execution: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },

  steps: {
    gap: spacing.xs,
  },

  resultLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.heading,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  resultBody: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.body,
    lineHeight: 22,
  },

  error: {
    color: colors.danger,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 20,
  },

  footer: {
    paddingBottom: spacing.lg,
  },
});
