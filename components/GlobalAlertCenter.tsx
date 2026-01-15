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
    <div
      className="fixed left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4 flex justify-center pointer-events-none"
      style={{ top: "50px", height: "70px" }}
    >
      <div className="w-full h-full flex items-start pt-4">
        <Alert
          tone={tone}
          className="text-center shadow-lg pointer-events-auto w-full"
        >
          {message}
        </Alert>
      </div>
    </div>
  );
}
