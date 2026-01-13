const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export async function sendOtp(phone: string): Promise<string | null> {
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

export async function verifyOtp(
  phone: string,
  otp: string,
  requestId: string
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp, requestId }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.token || data.verified || data.ok);
  } catch (err) {
    console.warn("verifyOtp failed", err);
    return false;
  }
}
