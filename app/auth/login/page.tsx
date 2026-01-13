"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phase, setPhase] = useState<"phone" | "otp">("phone");
  const [message, setMessage] = useState<string | null>(null);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    setMessage(
      "Would call /auth/send-otp on backend (Twilio/MSG91/Firebase). Mocking send."
    );
    setPhase("otp");
  };

  const handleVerify = (e: FormEvent) => {
    e.preventDefault();
    setMessage(
      "Would verify via /auth/verify-otp -> issue JWT. Mock success for now."
    );
  };

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-3xl font-semibold text-neutral-900">Phone login</h1>
      <p className="mt-2 text-sm text-neutral-700">
        Backend handles OTP; this UI is ready to plug in.
      </p>

      <form
        onSubmit={phase === "phone" ? handleSend : handleVerify}
        className="mt-6 space-y-4 rounded-2xl border border-black/5 bg-white p-6 shadow-sm"
      >
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-neutral-800">Phone</span>
          <input
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </label>

        {phase === "otp" && (
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-neutral-800">OTP</span>
            <input
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </label>
        )}

        {message && (
          <div className="rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
            {message}
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          {phase === "phone" ? "Send OTP" : "Verify"}
        </button>
      </form>

      <Link
        href="/profile"
        className="mt-4 inline-flex text-sm font-semibold text-neutral-700 underline"
      >
        Go to profile
      </Link>
    </div>
  );
}
