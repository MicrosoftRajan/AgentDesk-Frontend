import { Ionicons } from "@expo/vector-icons";
import { type ReactNode } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { STATUS_LABEL } from "../status";
import type { AppointmentStatus } from "../types";
import { desk, radius, space, type } from "./tokens";

export function useDeskLayout() {
  const { width } = useWindowDimensions();
  return {
    width,
    desktop: width >= 1080,
    tablet: width >= 760,
  };
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((part) => part && part !== "Dr.")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size < 32 ? 11 : 13 }]}>{initials(name)}</Text>
    </View>
  );
}

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.section}>{children}</Text>;
}

export function Body({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function Meta({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.meta, style]}>{children}</Text>;
}

const STATUS_TONE: Record<AppointmentStatus, { bg: string; fg: string }> = {
  pending: { bg: desk.warningSoft, fg: desk.warning },
  scheduled: { bg: desk.infoSoft, fg: desk.info },
  in_progress: { bg: desk.primarySoft, fg: desk.primary },
  completed: { bg: desk.successSoft, fg: desk.success },
  canceled: { bg: desk.dangerSoft, fg: desk.danger },
  incomplete: { bg: desk.slateSoft, fg: desk.slate },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const tone = STATUS_TONE[status];
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <View style={[styles.dot, { backgroundColor: tone.fg }]} />
      <Text style={[styles.badgeText, { color: tone.fg }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const BUTTON_BG: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: desk.primary },
  secondary: { backgroundColor: desk.secondary },
  ghost: { backgroundColor: desk.surface, borderWidth: 1, borderColor: desk.border },
  danger: { backgroundColor: desk.surface, borderWidth: 1, borderColor: "#FECACA" },
};

const BUTTON_HOVER: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: desk.primaryPressed },
  secondary: { backgroundColor: desk.secondaryPressed },
  ghost: { backgroundColor: desk.slateSoft },
  danger: { backgroundColor: desk.dangerSoft },
};

const LABEL_COLOR: Record<ButtonVariant, TextStyle> = {
  primary: { color: "#fff" },
  secondary: { color: "#fff" },
  ghost: { color: desk.text },
  danger: { color: desk.danger },
};

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const blocked = disabled || loading;
  const iconColor =
    variant === "primary" || variant === "secondary"
      ? "#fff"
      : variant === "danger"
        ? desk.danger
        : desk.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: blocked }}
      disabled={blocked}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.button,
        BUTTON_BG[variant],
        Platform.OS === "web" ? styles.pointer : null,
        hovered && !blocked ? BUTTON_HOVER[variant] : null,
        pressed && !blocked ? styles.pressed : null,
        blocked ? styles.disabled : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "ghost" || variant === "danger" ? desk.primary : "#fff"} />
      ) : (
        <View style={styles.buttonInner}>
          {icon ? <Ionicons color={iconColor} name={icon} size={16} /> : null}
          <Text style={[styles.buttonLabel, LABEL_COLOR[variant]]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  if (!onPress) {
    return <View style={[styles.card, style]}>{children}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.card,
        Platform.OS === "web" ? styles.pointer : null,
        pressed || hovered ? styles.cardHover : null,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  multiline?: boolean;
  keyboardType?: "default" | "phone-pad";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        style={[styles.input, multiline ? styles.inputMulti : null, error ? styles.inputError : null]}
        value={value}
      />
      {error ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipOn : null,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null,
        Platform.OS === "web" ? styles.pointer : null,
      ]}
    >
      <Text style={[styles.chipText, selected ? styles.chipTextOn : null]}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <Ionicons color={desk.primary} name="file-tray-outline" size={28} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.meta}>{body}</Text>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

export function ErrorState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons color={desk.danger} name="alert-circle-outline" size={28} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text accessibilityRole="alert" style={styles.meta}>
        {body}
      </Text>
    </View>
  );
}

export function Dialog({
  visible,
  title,
  children,
  onClose,
}: {
  visible: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel="Close dialog" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={styles.dialog}>
          <View style={styles.dialogHead}>
            <Text style={styles.dialogTitle}>{title}</Text>
            <Pressable accessibilityLabel="Close" onPress={onClose} style={styles.iconBtn}>
              <Ionicons color={desk.muted} name="close" size={18} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.dialogScroll}>
            <View style={styles.dialogBody}>{children}</View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function ToastHost({
  message,
  tone,
  onDismiss,
}: {
  message: string | null;
  tone: "ok" | "err";
  onDismiss: () => void;
}) {
  if (!message) {
    return null;
  }
  return (
    <View pointerEvents="box-none" style={styles.toastWrap}>
      <Pressable
        accessibilityRole="alert"
        onPress={onDismiss}
        style={[styles.toast, tone === "err" ? styles.toastErr : styles.toastOk]}
      >
        <Ionicons
          color={tone === "err" ? desk.danger : desk.success}
          name={tone === "err" ? "alert-circle" : "checkmark-circle"}
          size={18}
        />
        <Text style={styles.toastText}>{message}</Text>
      </Pressable>
    </View>
  );
}

export function Page({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.pageHead}>
        <View style={styles.pageTitles}>
          <Title>{title}</Title>
          {description ? <Meta>{description}</Meta> : null}
        </View>
        {action}
      </View>
      {children}
    </ScrollView>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.meta}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: desk.primarySoft,
  },
  avatarText: {
    color: desk.primary,
    fontFamily: type.semibold,
  },
  title: {
    color: desk.text,
    fontFamily: type.title,
    fontSize: 30,
    lineHeight: 36,
  },
  section: {
    color: desk.text,
    fontFamily: type.semibold,
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    color: desk.text,
    fontFamily: type.body,
    fontSize: 15,
    lineHeight: 22,
  },
  meta: {
    color: desk.muted,
    fontFamily: type.body,
    fontSize: 13,
    lineHeight: 18,
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontFamily: type.medium, fontSize: 12 },
  button: {
    minHeight: 44,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  buttonLabel: { fontFamily: type.semibold, fontSize: 14 },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.45 },
  pointer: { cursor: "pointer" },
  card: {
    backgroundColor: desk.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: desk.border,
    padding: space.md,
    gap: space.sm,
  },
  cardHover: { borderColor: "#CBD5E1" },
  field: { gap: 6 },
  fieldLabel: { color: desk.muted, fontFamily: type.medium, fontSize: 13 },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: desk.border,
    borderRadius: radius.sm,
    backgroundColor: desk.surface,
    paddingHorizontal: 12,
    color: desk.text,
    fontFamily: type.body,
    fontSize: 15,
  },
  inputMulti: { minHeight: 88, paddingTop: 10, textAlignVertical: "top" },
  inputError: { borderColor: desk.danger },
  errorText: { color: desk.danger, fontFamily: type.body, fontSize: 13 },
  chip: {
    minHeight: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: desk.border,
    backgroundColor: desk.surface,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  chipOn: { backgroundColor: desk.primarySoft, borderColor: desk.primary },
  chipText: { color: desk.text, fontFamily: type.medium, fontSize: 13 },
  chipTextOn: { color: desk.primary },
  empty: {
    backgroundColor: desk.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: desk.border,
    padding: space.lg,
    gap: space.sm,
    alignItems: "flex-start",
  },
  emptyTitle: { color: desk.text, fontFamily: type.semibold, fontSize: 16 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(23, 32, 51, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: space.md,
  },
  dialog: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "86%",
    backgroundColor: desk.surface,
    borderRadius: radius.lg,
    padding: space.md,
    gap: space.sm,
  },
  dialogHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
  },
  dialogTitle: { flex: 1, color: desk.text, fontFamily: type.semibold, fontSize: 18 },
  dialogScroll: { flexGrow: 0 },
  dialogBody: { gap: space.sm, paddingBottom: 4 },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  toastWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    alignItems: "center",
    zIndex: 20,
  },
  toast: {
    maxWidth: 520,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: desk.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toastOk: { borderColor: "#BBF7D0" },
  toastErr: { borderColor: "#FECACA" },
  toastText: { flex: 1, color: desk.text, fontFamily: type.medium, fontSize: 14 },
  page: { padding: space.lg, gap: space.lg, paddingBottom: 48 },
  pageHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: space.md,
    flexWrap: "wrap",
  },
  pageTitles: { flex: 1, gap: 4, minWidth: 220 },
  stat: {
    flexGrow: 1,
    flexBasis: 160,
    backgroundColor: desk.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: desk.border,
    padding: space.md,
    gap: 4,
  },
  statValue: { color: desk.text, fontFamily: type.title, fontSize: 28, lineHeight: 34 },
});
