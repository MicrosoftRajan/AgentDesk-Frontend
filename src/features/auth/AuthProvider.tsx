import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { getMe, type MeResponse } from "../../services/api/account";
import { supabase } from "../../services/supabase/client";

export type SignUpOutcome = "signed_in" | "confirmation_required";

interface AuthContextValue {
  session: Session | null;
  /** True until the stored session has been read from the device. */
  isLoading: boolean;
  /** The signed-in user's role and contact details (from the API). */
  account: MeResponse | null;
  /** True while the account is being fetched after sign-in. */
  isAccountLoading: boolean;
  /** Set when the account could not be loaded (e.g. API unreachable). */
  accountError: string | null;
  /** Re-fetches the account, e.g. after retrying a failed load. */
  reloadAccount: () => void;
  /** Replaces the cached account, e.g. after saving profile details. */
  setAccount: (account: MeResponse) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<SignUpOutcome>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [loadedAccount, setLoadedAccount] = useState<MeResponse | null>(null);
  // The error remembers which user + attempt it belongs to, so it clears
  // by itself on sign-out or retry (no state resets inside the effect).
  const [failure, setFailure] = useState<{
    userId: string;
    attempt: number;
    message: string;
  } | null>(null);
  const [accountReloadKey, setAccountReloadKey] = useState(0);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) {
          setSession(data.session);
        }
      })
      .catch(() => {
        // Unreadable stored session: treat as signed out.
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
      },
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  // Which side of the app to show depends on the role the API reports.
  useEffect(() => {
    if (!userId) {
      return;
    }

    const controller = new AbortController();

    getMe({ signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) {
          setLoadedAccount(result);
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setFailure({
          userId,
          attempt: accountReloadKey,
          message:
            error instanceof Error && error.message.length > 0
              ? error.message
              : "Could not load your account.",
        });
      });

    return () => controller.abort();
  }, [userId, accountReloadKey]);

  // Ignore an account that belongs to a previously signed-in user.
  const account = loadedAccount?.id === userId ? loadedAccount : null;
  const accountError =
    failure?.userId === userId && failure?.attempt === accountReloadKey
      ? failure.message
      : null;
  const isAccountLoading =
    userId !== null && account === null && accountError === null;

  const reloadAccount = useCallback(() => {
    setAccountReloadKey((key) => key + 1);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const signUp = useCallback(
    async (email: string, password: string): Promise<SignUpOutcome> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      // With email confirmation enabled there is no session yet.
      return data.session ? "signed_in" : "confirmation_required";
    },
    [],
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      // Make sure the device is signed out even if the server call failed.
      await supabase.auth.signOut({ scope: "local" });
    }
  }, []);

  const value = useMemo(
    () => ({
      session,
      isLoading,
      account,
      isAccountLoading,
      accountError,
      reloadAccount,
      setAccount: setLoadedAccount,
      signIn,
      signUp,
      signOut,
    }),
    [
      session,
      isLoading,
      account,
      isAccountLoading,
      accountError,
      reloadAccount,
      signIn,
      signUp,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }

  return context;
}
