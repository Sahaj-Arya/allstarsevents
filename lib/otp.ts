const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export const STATIC_OTP = process.env.NEXT_PUBLIC_STATIC_OTP || "000000";
// Treat BYPASS_OTP as a boolean flag; set NEXT_PUBLIC_BYPASS_OTP=true/1/yes to enable.
export const BYPASS_OTP = ["true", "1", "yes"].includes(
  (process.env.NEXT_PUBLIC_BYPASS_OTP || "").toLowerCase()
);

export async function sendOtp(phone: string): Promise<string | null> {
  console.log(
    process.env.NEXT_PUBLIC_BYPASS_OTP,
    "BYPASS_OTP",
    typeof process.env.NEXT_PUBLIC_BYPASS_OTP
  );

  if (BYPASS_OTP) {
    console.info("OTP bypass enabled; skipping send", { phone, STATIC_OTP });
    return "static-request-id";
  }
  try {
    const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.requestId || null;
  } catch (err) {
    console.warn("sendOtp failed", err);
    return null;
  }
}

type VerifyResult = { ok: boolean; token?: string; user?: { _id?: string } };

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
    if (!res.ok) return { ok: false };
    const data = await res.json();
    return {
      ok: Boolean(data.token || data.verified || data.ok),
      token: data.token,
      user: data.user,
    };
  } catch (err) {
    console.warn("verifyOtp failed", err);
    return { ok: false };
  }
}
