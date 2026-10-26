import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** False when the app was built without Supabase credentials. */
export const isAuthConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isAuthConfigured) {
  console.warn(
    "EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not set. " +
      "Sign-in is disabled.",
  );
}

// Expo web uses static rendering, which evaluates this module in Node where
// `window` does not exist. AsyncStorage's web build touches `window`, so use
// a no-op storage during server rendering.
const isServerRender = Platform.OS === "web" && typeof window === "undefined";

const serverStorage = {
  getItem: async (_key: string) => null,
  setItem: async (_key: string, _value: string) => {},
  removeItem: async (_key: string) => {},
};

// Only the public anon key belongs in the app. The service-role key
// lives on the backend and must never be bundled here.
export const supabase = createClient(
  // `||` (not `??`): an empty value in .env is "" and would make
  // supabase-js throw "supabaseKey is required." at import time.
  supabaseUrl || "http://localhost:54321",
  supabaseAnonKey || "missing-anon-key",
  {
    auth: {
      storage: isServerRender ? serverStorage : AsyncStorage,
      autoRefreshToken: !isServerRender,
      persistSession: !isServerRender,
      detectSessionInUrl: false,
    },
  },
);

// React Native has no tab-visibility events: refresh tokens only while
// the app is in the foreground.
AppState.addEventListener("change", (state) => {
  if (isServerRender) return;
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
