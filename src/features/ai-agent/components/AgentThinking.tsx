import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { Shimmer } from "../../../components/ui/Shimmer";
import { colors, fonts, radius, spacing } from "../../../theme";

function Dot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      return;
    }

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 450, easing: Easing.out(Easing.ease) }),
          withTiming(0.3, { duration: 450, easing: Easing.in(Easing.ease) }),
        ),
        -1,
      ),
    );

    return () => cancelAnimation(opacity);
  }, [delay, opacity, reduceMotion]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.dot, style]} />;
}

/** Shown while the agent is working and has nothing to display yet. */
export function AgentThinking({ label = "Thinking" }: { label?: string }) {
  return (
    <Animated.View
      accessibilityLabel={`${label}...`}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      entering={FadeIn.duration(250)}
      exiting={FadeOut.duration(200)}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.dots}>
          <Dot delay={0} />
          <Dot delay={150} />
          <Dot delay={300} />
        </View>
        <Text style={styles.label}>{label}...</Text>
      </View>

      <View style={styles.lines}>
        <Shimmer width="92%" />
        <Shimmer width="78%" />
        <Shimmer width="55%" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  dots: {
    flexDirection: "row",
    gap: 4,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primaryLight,
  },

  label: {
    color: colors.primaryLight,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },

  lines: {
    gap: spacing.sm,
  },
});
