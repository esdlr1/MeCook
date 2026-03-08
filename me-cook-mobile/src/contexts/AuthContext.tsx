import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { registerPushNotifications } from "../lib/notifications";
import { requestJson } from "../lib/api";
import type { AuthUser } from "../types/api";

const TOKEN_KEY = "mecook-auth-token";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (email: string, password: string, displayName: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const savedToken = token ?? (await SecureStore.getItemAsync(TOKEN_KEY));
    if (!savedToken) {
      setUser(null);
      setToken(null);
      return;
    }
    try {
      const payload = await requestJson<{ user: AuthUser }>("/api/auth/me", {
        token: savedToken,
      });
      setToken(savedToken);
      setUser(payload.user);
      await SecureStore.setItemAsync(TOKEN_KEY, savedToken);
    } catch {
      setUser(null);
      setToken(null);
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  }, [token]);

  useEffect(() => {
    (async () => {
      try {
        const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!savedToken) {
          return;
        }
        const payload = await requestJson<{ user: AuthUser }>("/api/auth/me", { token: savedToken });
        setToken(savedToken);
        setUser(payload.user);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!token || !user) {
      return;
    }
    void registerPushNotifications(token).catch(() => {
      // Keep auth flow resilient even if notification registration fails.
    });
  }, [token, user]);

  const signIn = useCallback(async (email: string, password: string) => {
    const payload = await requestJson<{ token: string; user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setToken(payload.token);
    setUser(payload.user);
    await SecureStore.setItemAsync(TOKEN_KEY, payload.token);
    return payload.user;
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const payload = await requestJson<{ token: string; user: AuthUser }>("/api/auth/signup", {
      method: "POST",
      body: { email, password, displayName },
    });
    setToken(payload.token);
    setUser(payload.user);
    await SecureStore.setItemAsync(TOKEN_KEY, payload.token);
    return payload.user;
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    setToken(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: !!user && !!token,
      signIn,
      signUp,
      signOut,
      refreshMe,
    }),
    [loading, refreshMe, signIn, signOut, signUp, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
