import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "../../../components/ui/AppButton";
import { colors, radius, spacing, fonts } from "../../../theme";
import type { ApprovalRequestResponse } from "../../../services/api/agents";
import {
  approvalDetails,
  formatExpiry,
  humanize,
} from "../domain/describeApproval";

interface ApprovalCardProps {
  approval: ApprovalRequestResponse;
  onApprove: () => void;
  onReject: () => void;
  /** True while a decision is being sent; disables both buttons. */
  isSubmitting?: boolean;
}

/**
 * Only the user can approve: the agent has no way to resolve this.
 */
export function ApprovalCard({
  approval,
  onApprove,
  onReject,
  isSubmitting = false,
}: ApprovalCardProps) {
  // Prefer the server's plain-language summary (patient name, time...)
  // over raw tool input such as appointment ids.
  const summary = approval.summary ?? null;
  const title = summary?.title ?? humanize(approval.toolName);
  const details = summary ? summary.lines : approvalDetails(approval);
  const expiry = formatExpiry(approval.expiresAt);

  return (
    <View accessibilityLiveRegion="polite" style={styles.card}>
      <Text style={styles.heading}>⚠️ Approval required</Text>

      <Text style={styles.label}>Agent wants to</Text>
      <Text style={styles.action}>{title}</Text>

      {details.map((detail) => (
        <View key={detail.label} style={styles.detail}>
          <Text style={styles.label}>{detail.label}</Text>
          <Text selectable style={styles.value}>
            {detail.value}
          </Text>
        </View>
      ))}

      <Text style={styles.meta}>
        {approval.riskLevel.toUpperCase()} risk
        {expiry ? ` · expires at ${expiry}` : ""}
      </Text>

      <View style={styles.actions}>
        <View style={styles.actionButton}>
          <AppButton
            accessibilityLabel={`Reject: ${title}`}
            disabled={isSubmitting}
            label="Reject"
            onPress={onReject}
            variant="secondary"
          />
        </View>
        <View style={styles.actionButton}>
          <AppButton
            accessibilityLabel={`Approve: ${title}`}
            disabled={isSubmitting}
            label={isSubmitting ? "Working…" : "Approve"}
            onPress={onApprove}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.warning,
  },

  heading: {
    color: colors.warning,
    fontSize: 16,
    fontFamily: fonts.display,
    marginBottom: spacing.xs,
  },

  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.heading,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  action: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },

  detail: {
    gap: 2,
    marginBottom: spacing.xs,
  },

  value: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.body,
    lineHeight: 22,
  },

  meta: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.body,
    marginTop: spacing.xs,
  },

  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  actionButton: {
    flex: 1,
  },
});
