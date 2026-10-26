import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "../../theme";

import { Shimmer } from "./Shimmer";

/** Card-shaped loading placeholder. */
export function ShimmerCard() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.when}>
          <Shimmer height={18} width="55%" />
          <Shimmer height={14} width="30%" />
        </View>
        <Shimmer borderRadius={radius.sm} height={22} width={74} />
      </View>
      <Shimmer width="85%" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  when: {
    flex: 1,
    gap: spacing.sm,
  },
});
