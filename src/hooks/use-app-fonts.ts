import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import {
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useFonts } from "expo-font";

import { fonts } from "../theme";

/** Loads the app's Google Fonts. Returns true once they are ready (or failed). */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    [fonts.display]: PlusJakartaSans_800ExtraBold,
    [fonts.heading]: PlusJakartaSans_700Bold,
    [fonts.semibold]: Inter_600SemiBold,
    [fonts.medium]: Inter_500Medium,
    [fonts.body]: Inter_400Regular,
  });

  // On error, fall back to system fonts rather than blocking the app.
  return loaded || error !== null;
}
