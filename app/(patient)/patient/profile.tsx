import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, fonts } from "@/theme";
import { useAuth } from "@/features/auth";
import { validateContactDetails } from "@/features/patients";
import { updatePatientProfile } from "@/services/api/patients";

export default function PatientProfileScreen() {
  const { account, setAccount } = useAuth();

  const [fullName, setFullName] = useState(account?.fullName ?? "");
  const [phone, setPhone] = useState(account?.phone ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    const validationError = validateContactDetails(fullName, phone);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const updated = await updatePatientProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
      });

      setAccount(updated);

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/patient");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not save your details.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.description}>
            We use these details to book appointments for you. Only the clinic
            front desk can see them.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.readOnly}>{account?.email ?? "—"}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              accessibilityLabel="Full name"
              autoCapitalize="words"
              autoComplete="name"
              editable={!isSaving}
              maxLength={100}
              onChangeText={setFullName}
              placeholder="Your full name"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              textContentType="name"
              value={fullName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Phone number</Text>
            <TextInput
              accessibilityLabel="Phone number"
              autoComplete="tel"
              editable={!isSaving}
              keyboardType="phone-pad"
              maxLength={20}
              onChangeText={setPhone}
              onSubmitEditing={handleSave}
              placeholder="+919876543210"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              textContentType="telephoneNumber"
              value={phone}
            />
          </View>

          {errorMessage ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {errorMessage}
            </Text>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <AppButton
            label={isSaving ? "Saving..." : "Save details"}
            onPress={handleSave}
            disabled={isSaving}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  content: {
    gap: spacing.md,
    paddingVertical: spacing.md,
  },

  description: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 20,
  },

  field: {
    gap: spacing.xs,
  },

  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.semibold,
  },

  readOnly: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.body,
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

  footer: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
});
