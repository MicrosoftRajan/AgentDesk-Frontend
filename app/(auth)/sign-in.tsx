import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, fonts } from "@/theme";
import { useAuth } from "@/features/auth";
import { isAuthConfigured } from "@/services/supabase/client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

type Mode = "sign_in" | "sign_up";

export default function SignInScreen() {
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const isSignUp = mode === "sign_up";

  const validate = (): string | null => {
    if (!EMAIL_PATTERN.test(email.trim())) {
      return "Enter a valid email address.";
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }

    return null;
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    const validationError = validate();

    if (validationError) {
      setErrorMessage(validationError);
      setInfoMessage(null);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const trimmedEmail = email.trim();

      if (isSignUp) {
        const outcome = await signUp(trimmedEmail, password);

        if (outcome === "confirmation_required") {
          setInfoMessage(
            "Account created. Check your email to confirm it, then sign in.",
          );
          setMode("sign_in");
          setPassword("");
        }
        // "signed_in": the auth guard moves us to the app.
      } else {
        await signIn(trimmedEmail, password);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(isSignUp ? "sign_in" : "sign_up");
    setErrorMessage(null);
    setInfoMessage(null);
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>CLINIC FRONT DESK</Text>
          <Text style={styles.title}>AgentDesk</Text>
          <Text style={styles.description}>
            {isSignUp
              ? "Create a patient account to book and manage your appointments."
              : "Sign in to book appointments, or to run the front desk if you are clinic staff."}
          </Text>
        </View>

        <View style={styles.form}>
          {!isAuthConfigured ? (
            <Text accessibilityRole="alert" style={styles.error}>
              Sign-in is not configured. Set EXPO_PUBLIC_SUPABASE_URL and
              EXPO_PUBLIC_SUPABASE_ANON_KEY in .env and restart Expo.
            </Text>
          ) : null}

          <TextInput
            accessibilityLabel="Email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            editable={!isSubmitting}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            textContentType="emailAddress"
            value={email}
          />

          <TextInput
            accessibilityLabel="Password"
            autoCapitalize="none"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            autoCorrect={false}
            editable={!isSubmitting}
            onChangeText={setPassword}
            onSubmitEditing={handleSubmit}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            returnKeyType="go"
            secureTextEntry
            style={styles.input}
            textContentType={isSignUp ? "newPassword" : "password"}
            value={password}
          />

          {errorMessage ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {errorMessage}
            </Text>
          ) : null}

          {infoMessage ? <Text style={styles.info}>{infoMessage}</Text> : null}

          <AppButton
            label={
              isSubmitting
                ? "Please wait..."
                : isSignUp
                  ? "Create Account"
                  : "Sign In"
            }
            onPress={handleSubmit}
            disabled={isSubmitting || !isAuthConfigured}
          />

          <AppButton
            label={
              isSignUp
                ? "I already have an account"
                : "Create a new account"
            }
            onPress={toggleMode}
            disabled={isSubmitting}
            variant="secondary"
          />
        </View>
      </KeyboardAvoidingView>
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
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.heading,
    letterSpacing: 1.5,
  },

  title: {
    color: colors.text,
    fontSize: 40,
    fontFamily: fonts.display,
  },

  description: {
    maxWidth: 340,
    color: colors.textSecondary,
    fontSize: 17,
    fontFamily: fonts.body,
    lineHeight: 26,
  },

  form: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },

  input: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.body,
  },

  error: {
    color: colors.danger,
    fontSize: 13,
    fontFamily: fonts.body,
    lineHeight: 18,
  },

  info: {
    color: colors.success,
    fontSize: 13,
    fontFamily: fonts.body,
    lineHeight: 18,
  },
});
