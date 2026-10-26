import { router, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/features/auth";
import { colors, fonts, spacing } from "@/theme";

export default function NotFoundScreen() {
  const { session } = useAuth();

  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <Screen>
        <View style={styles.container}>
          <Text style={styles.title}>This page does not exist.</Text>
          <Text style={styles.body}>
            The link may be out of date. Head back to AgentDesk.
          </Text>
          <AppButton
            label="Go to AgentDesk"
            onPress={() => router.replace(session ? "/" : "/sign-in")}
          />
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.md,
  },

  title: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 28,
    lineHeight: 34,
  },

  body: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
  },
});
