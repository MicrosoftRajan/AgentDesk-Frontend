import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";
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
  RunStatusBadge,
  formatRunDate,
  useAgentRuns,
} from "@/features/history";

export default function HistoryScreen() {
  const { data, isLoading, errorMessage, reload } = useAgentRuns();

  // Refresh when returning to this screen (e.g. after a new run);
  // the initial load is already handled by the hook.
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

  if (isLoading && !data) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (errorMessage && !data) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text accessibilityRole="alert" style={styles.error}>
            {errorMessage}
          </Text>
          <AppButton label="Retry" onPress={reload} variant="secondary" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.list}
        data={data ?? []}
        keyExtractor={(run) => run.id}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No agent runs yet. Start one and it will show up here.
          </Text>
        }
        onRefresh={reload}
        refreshing={isLoading}
        renderItem={({ item }) => (
          <Pressable
            accessibilityLabel={`Open run: ${item.goal}`}
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/history/[runId]",
                params: { runId: item.id },
              })
            }
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <Text numberOfLines={2} style={styles.goal}>
              {item.goal}
            </Text>
            <View style={styles.meta}>
              <RunStatusBadge status={item.status} />
              <Text style={styles.date}>{formatRunDate(item.createdAt)}</Text>
            </View>
          </Pressable>
        )}
      />
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

  list: {
    flexGrow: 1,
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },

  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  pressed: {
    opacity: 0.7,
  },

  goal: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.semibold,
    lineHeight: 22,
  },

  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  date: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.body,
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
});
