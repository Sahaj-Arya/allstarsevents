"use client";

import { createContext, useContext, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { UserProfile } from "./types";

function parseJwtExpMs(token?: string): number | null {
  if (!token) return null;

  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payloadJson = atob(padded);
    const payload = JSON.parse(payloadJson) as { exp?: number };

    if (!payload.exp || typeof payload.exp !== "number") return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

const AuthContext = createContext<
  | {
      profile: UserProfile | null;
      setProfile: (p: UserProfile | null) => void;
      clearProfile: () => void;
    }
  | undefined
>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useLocalStorage<UserProfile | null>(
    "profile",
    null,
  );

  const clearProfile = () => setProfile(null);

  useEffect(() => {
    const expiryMs = parseJwtExpMs(profile?.token);
    if (!expiryMs) return;

    const msUntilExpiry = expiryMs - Date.now();
    if (msUntilExpiry <= 0) {
      setProfile(null);
      return;
    }

    const timer = window.setTimeout(() => {
      setProfile(null);
    }, msUntilExpiry);

    return () => window.clearTimeout(timer);
  }, [profile?.token, setProfile]);

  return (
    <AuthContext.Provider value={{ profile, setProfile, clearProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
