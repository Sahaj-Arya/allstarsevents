"use client";

import { FormEvent, useState } from "react";
import { validateTicket } from "../../../lib/api";

export default function ValidatePage() {
  const [token, setToken] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleValidate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await validateTicket(token);
    setResult(JSON.stringify(res));
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <h1 className="text-3xl font-semibold text-white">Scan / validate</h1>
      <p className="mt-2 text-sm text-white/70">
        Calls backend /ticket/validate. Paste the QR token to simulate a scan.
      </p>

      <form
        onSubmit={handleValidate}
        className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur"
      >
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-white">Ticket token</span>
          <input
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Checking..." : "Validate"}
        </button>
        {result && (
          <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80">
            {result}
          </div>
        )}
      </form>
    </div>
  );
}
