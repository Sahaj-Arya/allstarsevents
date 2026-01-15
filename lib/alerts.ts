export type AlertTone = "info" | "success" | "error";

type AlertDetail = {
  message: string;
  tone?: AlertTone;
  durationMs?: number;
};

export function fireAlert(
  tone: AlertTone,
  message: string,
  durationMs?: number
) {
  if (typeof window === "undefined") return;
  if (!message) return;
  const detail: AlertDetail = { tone, message };
  if (typeof durationMs === "number") detail.durationMs = durationMs;
  window.dispatchEvent(new CustomEvent("app:alert", { detail }));
}
