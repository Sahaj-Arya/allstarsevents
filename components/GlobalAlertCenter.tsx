"use client";

import { useEffect, useRef, useState } from "react";
import { Alert } from "./ui/Alert";

type AlertTone = "info" | "success" | "error";

type AlertDetail = {
  message: string;
  tone?: AlertTone;
  durationMs?: number;
};

const DEFAULT_DURATION = 3000;

export function GlobalAlertCenter() {
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<AlertTone>("info");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<AlertDetail>).detail;
      if (!detail?.message) return;

      setMessage(detail.message);
      setTone(detail.tone || "info");

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      const duration = detail.durationMs ?? DEFAULT_DURATION;
      timerRef.current = window.setTimeout(() => {
        setMessage(null);
      }, duration);
    };

    window.addEventListener("app:alert", handler as EventListener);
    return () => {
      window.removeEventListener("app:alert", handler as EventListener);
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Alert tone={tone} className="text-center shadow-lg">
          {message}
        </Alert>
      </div>
    </div>
  );
}
