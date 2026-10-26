import { Ionicons } from "@expo/vector-icons";
import { Redirect, usePathname, useRouter, type Href } from "expo-router";
import { type ReactNode, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { profileOf } from "../availability";
import { describeEvent, eventsFor } from "../selectors";
import { usePrototype } from "../store";
import type { DemoRole } from "../types";
import { Avatar, Dialog, Meta, ToastHost, useDeskLayout } from "./primitives";
import { desk, radius, space, type } from "./tokens";

const NAV: Record<DemoRole, { href: string; label: string; icon: keyof typeof Ionicons.glyphMap; exact?: boolean }[]> = {
  patient: [
    { href: "/demo/patient", label: "Home", icon: "home-outline", exact: true },
    { href: "/demo/patient/book", label: "Book", icon: "add-circle-outline" },
    { href: "/demo/patient/appointments", label: "Visits", icon: "calendar-outline" },
    { href: "/demo/patient/profile", label: "Profile", icon: "person-outline" },
  ],
  staff: [
    { href: "/demo/staff", label: "Overview", icon: "grid-outline", exact: true },
    { href: "/demo/staff/appointments", label: "Appointments", icon: "list-outline" },
    { href: "/demo/staff/check-in", label: "Check-in", icon: "qr-code-outline" },
    { href: "/demo/staff/schedules", label: "Schedules", icon: "time-outline" },
  ],
  doctor: [
    { href: "/demo/doctor", label: "Today", icon: "sunny-outline", exact: true },
    { href: "/demo/doctor/appointments", label: "My visits", icon: "medkit-outline" },
    { href: "/demo/doctor/schedule", label: "Schedule", icon: "calendar-outline" },
  ],
};

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function RoleGate({ role, children }: { role: DemoRole; children: ReactNode }) {
  const { session } = usePrototype();
  if (!session) {
    return <Redirect href={"/demo" as Href} />;
  }
  if (session.role !== role) {
    return <Redirect href={"/demo" as Href} />;
  }
  return <DeskShell role={role}>{children}</DeskShell>;
}

function DeskShell({ role, children }: { role: DemoRole; children: ReactNode }) {
  const layout = useDeskLayout();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const { data, session, focusLocationId, setFocusLocationId, toast, dismissToast, reset } =
    usePrototype();
  const [menu, setMenu] = useState(false);
  const [notes, setNotes] = useState(false);
  const profile = profileOf(data, session?.profileId ?? null);
  const locations = data.locations.filter((location) =>
    role === "patient"
      ? true
      : data.staffAssignments.some(
          (row) => row.userId === session?.profileId && row.locationId === location.id,
        ),
  );
  const focus = data.locations.find((location) => location.id === focusLocationId) ?? locations[0];
  const items = NAV[role];
  const activity = session ? eventsFor(data, session, focus?.id ?? focusLocationId).slice(0, 8) : [];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.body}>
        {layout.desktop ? (
          <View style={styles.sidebar}>
            <View style={styles.brand}>
              <View style={styles.mark}>
                <Text style={styles.markText}>AD</Text>
              </View>
              <View>
                <Text style={styles.word}>AgentDesk</Text>
                <Text style={styles.brandSub}>{data.organization.name}</Text>
              </View>
            </View>
            <Text style={styles.navLabel}>
              {role === "patient" ? "Patient" : role === "staff" ? "Front desk" : "Physician"}
            </Text>
            {items.map((item) => {
              const active = isActive(pathname, item.href, item.exact);
              return (
                <Pressable
                  accessibilityRole="link"
                  key={item.href}
                  onPress={() => router.push(item.href as Href)}
                  style={[styles.navItem, active && styles.navItemOn]}
                >
                  <Ionicons color={active ? desk.primary : desk.muted} name={item.icon} size={18} />
                  <Text style={[styles.navText, active && styles.navTextOn]}>{item.label}</Text>
                </Pressable>
              );
            })}
            <View style={styles.sidebarFoot}>
              <Text style={styles.disclaimer}>
                Demo roles only. This switch does not authenticate anyone.
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.main}>
          <View style={styles.topbar}>
            {layout.desktop ? (
              <Text style={styles.crumb}>
                {data.organization.name}
                {role === "patient" ? "" : focus ? `  /  ${focus.name}` : ""}
              </Text>
            ) : (
              <View style={styles.brand}>
                <View style={styles.mark}>
                  <Text style={styles.markText}>AD</Text>
                </View>
                <Text style={styles.word}>AgentDesk</Text>
              </View>
            )}
            <View style={styles.topActions}>
              {role !== "patient" && focus ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Change branch"
                  onPress={() => {
                    const index = locations.findIndex((location) => location.id === focus.id);
                    const next = locations[(index + 1) % locations.length];
                    if (next) {
                      setFocusLocationId(next.id);
                    }
                  }}
                  style={styles.locationBtn}
                >
                  <Ionicons color={desk.primary} name="location-outline" size={16} />
                  <Text style={styles.locationText}>{focus.name}</Text>
                </Pressable>
              ) : (
                <Text style={styles.locationText}>{data.organization.name}</Text>
              )}
              <Pressable
                accessibilityLabel="Open activity"
                accessibilityRole="button"
                onPress={() => setNotes(true)}
                style={styles.iconBtn}
              >
                <Ionicons color={desk.text} name="notifications-outline" size={18} />
              </Pressable>
              <Pressable
                accessibilityLabel="Open profile menu"
                accessibilityRole="button"
                onPress={() => setMenu(true)}
                style={styles.userBtn}
              >
                <Avatar name={profile?.fullName ?? "Guest"} size={32} />
                {layout.tablet ? (
                  <View>
                    <Text style={styles.userName}>{profile?.fullName}</Text>
                    <Text style={styles.userRole}>{role}</Text>
                  </View>
                ) : null}
              </Pressable>
            </View>
          </View>
          <View style={styles.content}>{children}</View>
        </View>
      </View>

      {!layout.desktop ? (
        <View style={[styles.tabbar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {items.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            return (
              <Pressable
                accessibilityRole="link"
                key={item.href}
                onPress={() => router.push(item.href as Href)}
                style={styles.tab}
              >
                <Ionicons color={active ? desk.primary : desk.muted} name={item.icon} size={20} />
                <Text style={[styles.tabText, active && styles.navTextOn]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Dialog onClose={() => setMenu(false)} title="Demo profile" visible={menu}>
        <Text style={styles.userName}>{profile?.fullName}</Text>
        <Meta>
          Showing the {role} prototype as {profile?.fullName}. Phone {profile?.phone}. This menu
          does not sign you in.
        </Meta>
        <Pressable onPress={() => { setMenu(false); router.push("/demo" as Href); }} style={styles.menuRow}>
          <Text style={styles.menuText}>Switch demo role</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            reset();
            setMenu(false);
          }}
          style={styles.menuRow}
        >
          <Text style={styles.menuText}>Reset demo data</Text>
        </Pressable>
      </Dialog>

      <Dialog onClose={() => setNotes(false)} title="Recent activity" visible={notes}>
        <Meta>Local prototype history. Nothing here was sent to a server.</Meta>
        <ScrollView style={{ maxHeight: 360 }}>
          {activity.length === 0 ? <Meta>No activity yet.</Meta> : null}
          {activity.map((item) => (
            <View key={item.id} style={styles.note}>
              <Text style={styles.menuText}>{describeEvent(data, item)}</Text>
              <Meta>{new Date(item.createdAt).toLocaleString("en-IN")}</Meta>
            </View>
          ))}
        </ScrollView>
      </Dialog>

      <ToastHost
        message={toast?.message ?? null}
        onDismiss={dismissToast}
        tone={toast?.tone ?? "ok"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: desk.bg },
  body: { flex: 1, flexDirection: "row" },
  sidebar: {
    width: 248,
    backgroundColor: desk.surface,
    borderRightWidth: 1,
    borderRightColor: desk.border,
    padding: space.md,
    gap: 4,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: space.md },
  mark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: desk.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  markText: { color: "#fff", fontFamily: type.semibold, fontSize: 13 },
  word: { color: desk.text, fontFamily: type.semibold, fontSize: 16 },
  brandSub: { color: desk.muted, fontFamily: type.body, fontSize: 12 },
  navLabel: {
    color: desk.muted,
    fontFamily: type.medium,
    fontSize: 12,
    marginTop: 8,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  navItem: {
    minHeight: 44,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  navItemOn: { backgroundColor: desk.primarySoft },
  navText: { color: desk.text, fontFamily: type.medium, fontSize: 14 },
  navTextOn: { color: desk.primary },
  sidebarFoot: { marginTop: "auto" },
  disclaimer: { color: desk.muted, fontFamily: type.body, fontSize: 12, lineHeight: 18 },
  main: { flex: 1 },
  topbar: {
    minHeight: 60,
    paddingHorizontal: space.md,
    borderBottomWidth: 1,
    borderBottomColor: desk.border,
    backgroundColor: desk.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
  },
  crumb: { color: desk.muted, fontFamily: type.medium, fontSize: 13, flex: 1 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  locationBtn: {
    minHeight: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: desk.border,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: { color: desk.text, fontFamily: type.medium, fontSize: 13 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: desk.border,
  },
  userBtn: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44 },
  userName: { color: desk.text, fontFamily: type.semibold, fontSize: 14 },
  userRole: { color: desk.muted, fontFamily: type.body, fontSize: 12, textTransform: "capitalize" },
  content: { flex: 1 },
  tabbar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: desk.border,
    backgroundColor: desk.surface,
    paddingTop: 6,
  },
  tab: { flex: 1, alignItems: "center", gap: 2, minHeight: 48 },
  tabText: { color: desk.muted, fontFamily: type.medium, fontSize: 11 },
  menuRow: { minHeight: 44, justifyContent: "center" },
  menuText: { color: desk.text, fontFamily: type.medium, fontSize: 15 },
  note: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: desk.border,
    gap: 2,
  },
});
