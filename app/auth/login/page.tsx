"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { InputField } from "../../../components/ui/InputField";
import { Alert } from "../../../components/ui/Alert";
import { sendOtp, verifyOtp, BYPASS_OTP, STATIC_OTP } from "../../../lib/otp";
import { UserProfile } from "../../../lib/types";
import { fetchTickets } from "../../../lib/api";
import { useCart } from "../../../lib/cart-context";
import { useAuth } from "../../../lib/auth-context";

export default function LoginPage() {
  const { replaceBookings } = useCart();
  const { profile, setProfile } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phase, setPhase] = useState<"phone" | "otp">("phone");
  const [message, setMessage] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!phone) {
      setError("Enter phone number first");
      return;
    }
    setLoading(true);
    const reqId = await sendOtp(phone);
    setLoading(false);
    if (reqId) {
      setRequestId(reqId);
      setPhase("otp");
      if (BYPASS_OTP) setOtp(STATIC_OTP);
      setMessage(
        BYPASS_OTP
          ? `OTP bypassed (using ${STATIC_OTP})`
          : `OTP sent. Use code ${STATIC_OTP} in dev.`
      );
    } else {
      setError("Failed to send OTP");
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!requestId && !BYPASS_OTP) {
      setError("Send OTP first");
      return;
    }
    setLoading(true);
    const verified = await verifyOtp(
      phone,
      otp || STATIC_OTP,
      requestId || "bypass"
    );
    if (!verified.ok) {
      setLoading(false);
      setError("OTP verification failed");
      return;
    }

    const newProfile: UserProfile = {
      name: profile?.name || "",
      email: profile?.email || "",
      phone,
      token: verified.token,
      userId: verified.user?._id,
    };
    setProfile(newProfile);

    const tickets = await fetchTickets(verified.token, phone);
    replaceBookings(tickets);

    setLoading(false);
    setMessage("Logged in via OTP. Tickets synced.");
  };

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-3xl font-semibold text-neutral-900">Phone login</h1>
      <p className="mt-2 text-sm text-neutral-700">
        Backend handles OTP; this UI is ready to plug in.
      </p>

      <Card>
        <form
          onSubmit={phase === "phone" ? handleSend : handleVerify}
          className="space-y-4"
        >
          <InputField
            label="Phone"
            required
            requiredMark
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          {phase === "otp" && (
            <InputField
              label="OTP"
              required
              requiredMark
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          )}

          {error && <Alert tone="error">{error}</Alert>}
          {message && <Alert tone="info">{message}</Alert>}

          <Button type="submit" fullWidth disabled={loading}>
            {loading
              ? "Please wait..."
              : phase === "phone"
              ? "Send OTP"
              : "Verify"}
          </Button>
        </form>
      </Card>

      <Link
        href="/profile"
        className="mt-4 inline-flex text-sm font-semibold text-neutral-700 underline"
      >
        Go to profile
      </Link>
    </div>
  );
}
