"use client";

import React from "react";
import { AuthProvider } from "../lib/auth-context";
import { GlobalAlertCenter } from "../components/GlobalAlertCenter";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <GlobalAlertCenter />
    </AuthProvider>
  );
}
