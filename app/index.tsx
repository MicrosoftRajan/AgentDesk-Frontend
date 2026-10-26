import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router } from "expo-router";

import Animated, { FadeInDown } from "react-native-reanimated";

import { AnimatedWelcomeText } from "@/components/ui/AnimatedWelcomeText";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { AppButton } from "@/components/ui/AppButton";
import { useAuth } from "@/features/auth";
import {
  colors,
  spacing,
  fonts,
} from "@/theme";

const HIGHLIGHTS = [
  "Books, reschedules and reminds",
  "Follows up on no-shows",
  "Cancels and refunds only after your approval",
] as const;

/** "/" sends each role to its own home. */
export default function HomeScreen() {
  const { account } = useAuth();

  if (account?.role === "patient") {
    return <Redirect href="/patient" />;
  }

  return <StaffHome />;
}

function StaffHome() {
  const { session, signOut } = useAuth();

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            CLINIC FRONT DESK
          </Text>

          <AnimatedWelcomeText
            highlight={["AgentDesk"]}
            style={styles.title}
            text="Welcome to AgentDesk"
          />

          <Text style={styles.description}>
            An AI assistant for your front desk. It handles
            appointments and follow-ups, and asks you before
            anything risky.
          </Text>

          <Card index={2} style={styles.highlights}>
            {HIGHLIGHTS.map((text, index) => (
              <Animated.View
                entering={FadeInDown.delay(500 + index * 120).springify()}
                key={text}
                style={styles.highlightRow}
              >
                <View style={styles.bullet} />
                <Text style={styles.highlightText}>{text}</Text>
              </Animated.View>
            ))}
          </Card>
        </View>

        <Animated.View
          entering={FadeInDown.delay(700).springify()}
          style={styles.action}
        >
          <AppButton
            label="Appointments"
            onPress={() => router.push("/appointments")}
          />

          <AppButton
            label="Ask the Agent"
            onPress={() => router.push("/agent")}
            variant="secondary"
          />

          <AppButton
            label="Agent History"
            onPress={() => router.push("/history")}
            variant="secondary"
          />

          <Text style={styles.account}>
            Signed in as {session?.user.email ?? "your account"}
          </Text>

          <AppButton
            label="Sign Out"
            onPress={signOut}
            variant="secondary"
          />
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: spacing.xxl,
  },

  header: {
    gap: spacing.sm,
  },

  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontFamily: fonts.heading,
    letterSpacing: 1.5,
  },

  title: {
    fontSize: 38,
    lineHeight: 46,
  },

  description: {
    maxWidth: 340,
    color: colors.textSecondary,
    fontSize: 17,
    fontFamily: fonts.body,
    lineHeight: 26,
  },

  highlights: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryLight,
  },

  highlightText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 20,
  },

  action: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },

  account: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.body,
    textAlign: "center",
    paddingTop: spacing.sm,
  },
});
