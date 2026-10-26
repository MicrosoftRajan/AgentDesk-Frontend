import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import Animated, { FadeInDown } from "react-native-reanimated";

import { AnimatedWelcomeText } from "@/components/ui/AnimatedWelcomeText";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { ShimmerCard } from "@/components/ui/ShimmerCard";
import { colors, spacing, fonts } from "@/theme";
import { useAuth } from "@/features/auth";
import {
  splitAppointments,
  useMyAppointments,
} from "@/features/patients";
import { PatientAppointmentCard } from "@/features/patients/PatientAppointmentCard";

export default function PatientHomeScreen() {
  const { account, signOut } = useAuth();
  const { data, reload } = useMyAppointments();

  // Refresh when coming back from booking / cancelling.
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

  const next = useMemo(
    () => splitAppointments(data ?? []).upcoming[0] ?? null,
    [data],
  );

  const hasProfile = Boolean(account?.fullName && account?.phone);
  const firstName = account?.fullName?.trim().split(/\s+/)[0];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>PATIENT PORTAL</Text>
          <AnimatedWelcomeText
            highlight={firstName ? [firstName] : []}
            key={firstName ?? "welcome"}
            style={styles.title}
            text={firstName ? `Hello, ${firstName}` : "Welcome"}
          />
          <Animated.Text
            entering={FadeInDown.delay(500).springify()}
            style={styles.description}
          >
            Book a visit, check your appointments or cancel one, any time.
          </Animated.Text>
        </View>

        {!hasProfile ? (
          <Card index={1} tone={colors.warning}>
            <Text style={styles.noticeText}>
              Add your name and phone number so you can book appointments.
            </Text>
            <AppButton
              label="Add my details"
              onPress={() => router.push("/patient/profile")}
            />
          </Card>
        ) : null}

        <View style={styles.next}>
          <Text style={styles.sectionTitle}>Next appointment</Text>

          {next ? (
            <PatientAppointmentCard appointment={next} index={2} />
          ) : data ? (
            <Card index={1}>
              <Text style={styles.empty}>You have nothing booked.</Text>
            </Card>
          ) : (
            <ShimmerCard />
          )}
        </View>
      </ScrollView>

      <Animated.View
        entering={FadeInDown.delay(750).springify()}
        style={styles.actions}
      >
        <AppButton
          label="Book an appointment"
          onPress={() => router.push("/patient/book")}
        />

        <AppButton
          label="My appointments"
          onPress={() => router.push("/patient/appointments")}
          variant="secondary"
        />

        <AppButton
          label="My details"
          onPress={() => router.push("/patient/profile")}
          variant="secondary"
        />

        <Text style={styles.account}>
          Signed in as {account?.email ?? "your account"}
        </Text>

        <AppButton label="Sign Out" onPress={signOut} variant="secondary" />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
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
    fontSize: 36,
    lineHeight: 44,
  },

  description: {
    maxWidth: 340,
    color: colors.textSecondary,
    fontSize: 16,
    fontFamily: fonts.body,
    lineHeight: 24,
  },

  noticeText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 20,
  },

  next: {
    gap: spacing.sm,
  },

  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.heading,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  empty: {
    color: colors.textSecondary,
    fontSize: 15,
    fontFamily: fonts.body,
  },

  actions: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },

  account: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.body,
    textAlign: "center",
    paddingTop: spacing.xs,
  },
});
