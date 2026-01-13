"use client";

import { createContext, useContext } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { UserProfile } from "./types";

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
    null
  );

  const clearProfile = () => setProfile(null);

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
