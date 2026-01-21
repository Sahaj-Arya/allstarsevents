import { fireAlert } from "./alerts";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export const STATIC_OTP = process.env.NEXT_PUBLIC_STATIC_OTP || "000000";

export async function sendOtp(phone: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || "Failed to send OTP");
    }
    fireAlert("success", "OTP sent");
    return data.requestId || null;
  } catch (err) {
    console.warn("sendOtp failed", err);
    const message = err instanceof Error ? err.message : "Failed to send OTP";
    fireAlert("error", message);
    return null;
  }
}

type VerifyResult = {
  ok: boolean;
  token?: string;
  user?: { _id?: string };
  error?: string;
};

export async function verifyOtp(
  phone: string,
  otp: string,
  requestId: string,
  extra?: { name?: string; email?: string }
): Promise<VerifyResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp, requestId, ...extra }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data?.error || "Request failed" };
    }
    const data = await res.json();
    return {
      ok: Boolean(data.token || data.verified || data.ok),
      token: data.token,
      user: data.user,
      error: data?.error,
    };
  } catch (err) {
    console.warn("verifyOtp failed", err);
    const message = err instanceof Error ? err.message : "verifyOtp failed";
    return { ok: false, error: message };
  }
}
