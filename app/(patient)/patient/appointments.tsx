import { router } from "expo-router";
import { useMemo } from "react";
import {
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { Screen } from "@/components/ui/Screen";
import { ShimmerCard } from "@/components/ui/ShimmerCard";
import { colors, spacing, fonts } from "@/theme";
import {
  splitAppointments,
  useMyAppointments,
} from "@/features/patients";
import { PatientAppointmentCard } from "@/features/patients/PatientAppointmentCard";

export default function MyAppointmentsScreen() {
  const { data, isLoading, errorMessage, reload } = useMyAppointments();

  const sections = useMemo(() => {
    const { upcoming, past } = splitAppointments(data ?? []);

    return [
      { title: "Upcoming", data: upcoming },
      { title: "Past & cancelled", data: past },
    ].filter((section) => section.data.length > 0);
  }, [data]);

  if (isLoading && !data) {
    return (
      <Screen>
        <View style={styles.skeletons}>
          <ShimmerCard />
          <ShimmerCard />
          <ShimmerCard />
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
      <SectionList
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              You have no appointments yet.
            </Text>
            <AppButton
              label="Book an appointment"
              onPress={() => router.push("/patient/book")}
            />
          </View>
        }
        onRefresh={reload}
        refreshing={isLoading}
        renderItem={({ item, index }) => (
          <PatientAppointmentCard
            appointment={item}
            index={index}
            onCancelled={reload}
          />
        )}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        sections={sections}
        stickySectionHeadersEnabled={false}
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
    paddingVertical: spacing.md,
  },

  skeletons: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },

  separator: {
    height: spacing.sm,
  },

  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.heading,
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },

  empty: {
    gap: spacing.md,
    marginTop: spacing.xxl,
  },

  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontFamily: fonts.body,
    lineHeight: 22,
    textAlign: "center",
  },

  error: {
    color: colors.danger,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 20,
    textAlign: "center",
  },
});
