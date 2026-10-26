import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

import { supabase } from "../supabase/client";

const DEFAULT_API_BASE_URL = "http://localhost:3000";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function isLoopbackHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}

/** Metro host from the Expo dev server, without the port. */
function developmentServerHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;

  if (!hostUri) {
    return null;
  }

  const hostname = hostUri.startsWith("[")
    ? hostUri.slice(1, hostUri.indexOf("]"))
    : hostUri.split(":")[0];

  if (!hostname || isLoopbackHost(hostname)) {
    return null;
  }

  return hostname;
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

/**
 * `localhost` is the phone itself on a device, and the emulator loopback
 * on Android. In development, rewrite a loopback API origin to the computer
 * running Expo. A non-loopback EXPO_PUBLIC_API_BASE_URL is left unchanged,
 * which is what production and a manually set LAN address should use.
 */
export function resolveApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  const raw =
    configured && configured.length > 0 ? configured : DEFAULT_API_BASE_URL;

  if (Platform.OS === "web") {
    return stripTrailingSlash(raw);
  }

  let url: URL;

  try {
    url = new URL(raw);
  } catch {
    return stripTrailingSlash(raw);
  }

  if (!isLoopbackHost(url.hostname)) {
    return stripTrailingSlash(raw);
  }

  const devHost = developmentServerHost();

  if (devHost) {
    url.hostname = devHost;
  } else if (Platform.OS === "android" && !Device.isDevice) {
    // Android emulator alias for the host machine's loopback.
    url.hostname = "10.0.2.2";
  } else {
    return stripTrailingSlash(raw);
  }

  return stripTrailingSlash(url.toString());
}

const API_BASE_URL = resolveApiBaseUrl();

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code?: string;
    message: string;
  };
}

/** Current access token. supabase-js refreshes it first if it is about to expire. */
async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();

  return data.session?.access_token ?? null;
}

export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = await getAccessToken();

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(
      `Cannot reach the API at ${API_BASE_URL}. Check that the backend is running and reachable from this device.`,
      0,
    );
  }

  let body: ApiResponse<T>;

  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(
      `API returned invalid JSON (${response.status})`,
      response.status,
    );
  }

  if (response.status === 401) {
    // The server rejected our session: drop it so the auth guard
    // sends the user back to sign-in.
    await supabase.auth.signOut({ scope: "local" });
  }

  if (!response.ok || !body.success) {
    throw new ApiError(
      body.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
      body.error?.code,
    );
  }

  if (body.data === undefined) {
    throw new ApiError("API response is missing data", response.status);
  }

  return body.data;
}
