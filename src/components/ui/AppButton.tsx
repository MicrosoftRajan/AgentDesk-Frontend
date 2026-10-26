import { Pressable, StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { colors, fonts, radius, spacing } from "../../theme";

interface AppButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  accessibilityLabel?: string;
}

export function AppButton({
  label,
  onPress,
  disabled = false,
  variant = "primary",
  accessibilityLabel,
}: AppButtonProps) {
  const isSecondary = variant === "secondary";
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => {
          scale.set(withSpring(0.96, { damping: 15, stiffness: 320 }));
        }}
        onPressOut={() => {
          scale.set(withSpring(1, { damping: 12, stiffness: 220 }));
        }}
        style={({ pressed }) => [
          styles.button,
          isSecondary ? styles.secondary : styles.primary,
          pressed && !disabled && (isSecondary ? styles.secondaryPressed : styles.pressed),
          disabled && styles.disabled,
        ]}
      >
        <Text style={[styles.label, isSecondary && styles.secondaryLabel]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },

  primary: {
    backgroundColor: colors.primary,
  },

  secondary: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
  },

  pressed: {
    backgroundColor: colors.primaryPressed,
  },

  secondaryPressed: {
    backgroundColor: colors.surface,
  },

  disabled: {
    opacity: 0.45,
  },

  label: {
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 16,
  },

  secondaryLabel: {
    color: colors.text,
  },
});
