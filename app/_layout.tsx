import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { Screen } from "@/components/ui/Screen";
import { AuthProvider, useAuth } from "@/features/auth";
import { useAppFonts } from "@/hooks/use-app-fonts";
import { colors, fonts, spacing } from "@/theme";

// Keep the splash screen up until the Google Fonts are ready.
void SplashScreen.preventAutoHideAsync();

function LoadingScreen() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

/** Shown when we are signed in but cannot tell which side to open. */
function AccountErrorScreen({ message }: { message: string }) {
  const { reloadAccount, signOut } = useAuth();

  return (
    <Screen>
      <View style={styles.center}>
        <Text accessibilityRole="alert" style={styles.error}>
          {message}
        </Text>
        <AppButton label="Try again" onPress={reloadAccount} />
        <AppButton label="Sign Out" onPress={signOut} variant="secondary" />
      </View>
    </Screen>
  );
}

function RootNavigator() {
  const { session, isLoading, account, isAccountLoading, accountError } =
    useAuth();

  // Wait for the stored session so a signed-in user never sees a
  // flash of the sign-in screen.
  if (isLoading) {
    return null;
  }

  const isSignedIn = session !== null;

  // Signed in, but the role decides which screens exist. Do not guess.
  if (isSignedIn && isAccountLoading) {
    return <LoadingScreen />;
  }

  if (isSignedIn && !account) {
    return (
      <AccountErrorScreen
        message={accountError ?? "Could not load your account."}
      />
    );
  }

  const isStaff = isSignedIn && account?.role === "staff";
  const isPatient = isSignedIn && account?.role === "patient";

  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
        headerTitleStyle: { fontFamily: fonts.heading },
        animation: "fade_from_bottom",
      }}
    >
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen
          name="(auth)/sign-in"
          options={{
            title: "Sign In",
            headerShown: false,
          }}
        />
      </Stack.Protected>

      {/* "/" picks the right home for the signed-in role. */}
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen
          name="index"
          options={{
            title: "AgentDesk",
          }}
        />
      </Stack.Protected>

      {/* Clinic staff side. Group segments are not part of the URL. */}
      <Stack.Protected guard={isStaff}>
        <Stack.Screen
          name="(staff)/appointments/index"
          options={{
            title: "Appointments",
          }}
        />

        <Stack.Screen
          name="(staff)/agent/index"
          options={{
            title: "New Agent Run",
          }}
        />

        <Stack.Screen
          name="(staff)/history/index"
          options={{
            title: "History",
          }}
        />

        <Stack.Screen
          name="(staff)/history/[runId]"
          options={{
            title: "Run Details",
          }}
        />
      </Stack.Protected>

      {/* Patient side */}
      <Stack.Protected guard={isPatient}>
        <Stack.Screen
          name="(patient)/patient/index"
          options={{
            title: "My Care",
            headerBackVisible: false,
          }}
        />

        <Stack.Screen
          name="(patient)/patient/book"
          options={{
            title: "Book Appointment",
          }}
        />

        <Stack.Screen
          name="(patient)/patient/appointments"
          options={{
            title: "My Appointments",
          }}
        />

        <Stack.Screen
          name="(patient)/patient/profile"
          options={{
            title: "My Details",
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const fontsReady = useAppFonts();

  useEffect(() => {
    if (fontsReady) {
      void SplashScreen.hideAsync();
    }
  }, [fontsReady]);

  if (!fontsReady) {
    return null;
  }

  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },

  error: {
    color: colors.danger,
    fontSize: 15,
    fontFamily: fonts.body,
    lineHeight: 22,
    textAlign: "center",
  },
});
