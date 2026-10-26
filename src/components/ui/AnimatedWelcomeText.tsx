import { StyleSheet, View, type TextStyle } from "react-native";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";

import { colors, fonts } from "../../theme";

interface AnimatedWelcomeTextProps {
  text: string;
  style?: TextStyle;
  /** Delay before the first word appears, in ms. */
  delay?: number;
  /** Gap between words appearing, in ms. */
  stagger?: number;
  /** Words (exact match, case-insensitive) drawn in the accent colour. */
  highlight?: string[];
}

/**
 * Reveals a heading word by word: each word fades in while
 * springing up from below.
 */
export function AnimatedWelcomeText({
  text,
  style,
  delay = 150,
  stagger = 90,
  highlight = [],
}: AnimatedWelcomeTextProps) {
  const reduceMotion = useReducedMotion();
  const words = text.split(/\s+/).filter(Boolean);
  const accented = new Set(highlight.map((word) => word.toLowerCase()));

  return (
    <View accessible accessibilityRole="header" accessibilityLabel={text} style={styles.row}>
      {words.map((word, index) => (
        <Animated.Text
          entering={
            reduceMotion
              ? undefined
              : FadeInDown.delay(delay + index * stagger)
                  .springify()
                  .damping(14)
                  .stiffness(120)
          }
          importantForAccessibility="no"
          key={`${word}-${index}`}
          style={[
            styles.word,
            style,
            accented.has(word.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase()) && {
              color: colors.primaryLight,
            },
          ]}
        >
          {word}
        </Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 10,
  },

  word: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 44,
  },
});
