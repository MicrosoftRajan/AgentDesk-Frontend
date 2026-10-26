import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { colors, radius } from "../../theme";

interface ShimmerProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A skeleton block with a light band sweeping across it.
 * Use it as a placeholder while something is loading or "thinking".
 */
export function Shimmer({
  width = "100%",
  height = 14,
  borderRadius = radius.sm,
  style,
}: ShimmerProps) {
  const [layoutWidth, setLayoutWidth] = useState(0);
  const progress = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );

    return () => cancelAnimation(progress);
  }, [progress, reduceMotion]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -layoutWidth + progress.value * layoutWidth * 2 },
    ],
  }));

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(event) => setLayoutWidth(event.nativeEvent.layout.width)}
      style={[
        styles.base,
        { width, height, borderRadius },
        style,
      ]}
    >
      {reduceMotion || layoutWidth === 0 ? null : (
        <Animated.View style={[StyleSheet.absoluteFill, sweepStyle]}>
          <LinearGradient
            colors={["transparent", "rgba(167, 139, 250, 0.22)", "transparent"]}
            end={{ x: 1, y: 0.5 }}
            start={{ x: 0, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
    backgroundColor: colors.surfaceElevated,
  },
});
