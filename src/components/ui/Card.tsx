import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { colors, radius, spacing } from "../../theme";

interface CardProps extends PropsWithChildren {
  /** Position in a list; staggers the entrance animation. */
  index?: number;
  /** Makes the whole card tappable, with a press animation. */
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Border colour; defaults to the neutral border. */
  tone?: string;
  style?: StyleProp<ViewStyle>;
}

/** Elevated surface that slides in on mount and springs on press. */
export function Card({
  children,
  index = 0,
  onPress,
  accessibilityLabel,
  tone,
  style,
}: CardProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const entering = reduceMotion
    ? undefined
    : FadeInDown.delay(Math.min(index, 8) * 70)
        .springify()
        .damping(16);

  const cardStyle = [
    styles.card,
    tone ? { borderColor: tone } : null,
    style,
  ];

  if (!onPress) {
    return (
      <Animated.View entering={entering} style={cardStyle}>
        {children}
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={entering}>
      <Animated.View style={pressStyle}>
        <Pressable
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          onPress={onPress}
          onPressIn={() => {
            scale.set(withSpring(0.97, { damping: 15, stiffness: 300 }));
          }}
          onPressOut={() => {
            scale.set(withSpring(1, { damping: 12, stiffness: 220 }));
          }}
          style={cardStyle}
        >
          <View style={styles.inner}>{children}</View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },

  inner: {
    gap: spacing.sm,
  },
});
