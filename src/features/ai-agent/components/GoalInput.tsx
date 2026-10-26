import { StyleSheet, Text, TextInput, View } from "react-native";

import { colors, radius, spacing, fonts } from "../../../theme";
import { GOAL_MAX_LENGTH } from "../constants";

interface GoalInputProps {
  value: string;
  onChangeText: (value: string) => void;
  editable?: boolean;
  errorMessage?: string | null;
  maxLength?: number;
}

export function GoalInput({
  value,
  onChangeText,
  editable = true,
  errorMessage = null,
  maxLength = GOAL_MAX_LENGTH,
}: GoalInputProps) {
  const showCount = value.length >= maxLength * 0.8;

  return (
    <View style={styles.wrapper}>
      <TextInput
        accessibilityLabel="Goal"
        accessibilityHint="Describe what you want the agent to accomplish"
        editable={editable}
        maxLength={maxLength}
        multiline
        numberOfLines={4}
        onChangeText={onChangeText}
        placeholder="Reschedule Ravi Kumar's appointment to Friday 11 am"
        placeholderTextColor={colors.textMuted}
        returnKeyType="default"
        style={[styles.input, !editable && styles.inputDisabled]}
        textAlignVertical="top"
        value={value}
      />

      {showCount ? (
        <Text style={styles.count}>
          {maxLength - value.length} characters remaining
        </Text>
      ) : null}

      {errorMessage ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },

  input: {
    minHeight: 110,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.body,
    lineHeight: 22,
  },

  inputDisabled: {
    opacity: 0.7,
  },

  count: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.body,
  },

  error: {
    color: colors.danger,
    fontSize: 13,
    fontFamily: fonts.body,
    lineHeight: 18,
  },
});
