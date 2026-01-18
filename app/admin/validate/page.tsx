"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { validateTicket } from "../../../lib/api";

type Html5QrcodeType = {
  start: (
    config: { facingMode: string },
    options: { fps: number; qrbox: number; aspectRatio?: number },
    onSuccess: (text: string) => void,
    onError: (message: string) => void
  ) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => void;
};

export default function ValidatePage() {
  const [token, setToken] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const qrRef = useRef<Html5QrcodeType | null>(null);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [validationResult, setValidationResult] = useState<null | {
    status?: string;
    user?: { name?: string; phone?: string; email?: string };
    ticket?: { id?: string; isScanned?: boolean; scannedAt?: string };
    tickets?: Array<{ id?: string; isScanned?: boolean; scannedAt?: string }>;
    error?: string;
  }>(null);

  const runValidation = async (value: string) => {
    if (!value) return;
    setLoading(true);
    const res = await validateTicket(value);
    setValidationResult(res);
    setResult(JSON.stringify(res));
    setLoading(false);
  };

  const handleValidate = async (e: FormEvent) => {
    e.preventDefault();
    await runValidation(token);
  };

  useEffect(() => {
    let mounted = true;
    if (!scannerActive) return undefined;

    const init = async () => {
      try {
        if (typeof window !== "undefined") {
          const isLocalhost =
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1";
          if (!window.isSecureContext && !isLocalhost) {
            if (mounted) {
              setScannerError(
                "Camera requires HTTPS on mobile browsers. Use HTTPS or localhost."
              );
              setScannerActive(false);
            }
            return;
          }
        }

        if (!permissionChecked && navigator?.mediaDevices?.getUserMedia) {
          try {
            await navigator.mediaDevices.getUserMedia({ video: true });
            if (mounted) setPermissionChecked(true);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Camera permission denied";
            if (mounted) {
              setScannerError(
                `${message}. Please allow camera access and use HTTPS on mobile.`
              );
              setScannerActive(false);
            }
            return;
          }
        }

        const module = await import("html5-qrcode");
        if (!mounted) return;
        const instance: Html5QrcodeType = new module.Html5Qrcode("qr-reader");
        qrRef.current = instance;
        const qrbox =
          typeof window !== "undefined"
            ? Math.max(220, Math.min(320, Math.floor(window.innerWidth * 0.7)))
            : 250;
        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox, aspectRatio: 1.0 },
          async (decodedText: string) => {
            setToken(decodedText);
            setScannerActive(false);
            await runValidation(decodedText);
          },
          () => {}
        );
      } catch (err) {
        setScannerError(
          err instanceof Error ? err.message : "Failed to start scanner"
        );
        setScannerActive(false);
      }
    };

    init();

    return () => {
      mounted = false;
      if (qrRef.current) {
        qrRef.current
          .stop()
          .then(() => qrRef.current?.clear())
          .catch(() => undefined)
          .finally(() => {
            qrRef.current = null;
          });
      }
    };
  }, [scannerActive]);

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <h1 className="text-3xl font-semibold text-white">Scan / validate</h1>
      <p className="mt-2 text-sm text-white/70">
        Use camera scan for tickets, or paste the token if needed.
      </p>

      <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-white">Camera scanner</p>
          <button
            type="button"
            onClick={() => {
              setScannerError(null);
              setScannerActive((prev) => !prev);
            }}
            className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white"
          >
            {scannerActive ? "Stop scanner" : "Start scanner"}
          </button>
        </div>
        <div
          id="qr-reader"
          className="overflow-hidden rounded-xl border border-white/10 bg-black/40"
          style={{ minHeight: scannerActive ? 240 : 0 }}
        />
        {scannerError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
            {scannerError}
          </div>
        )}
      </div>

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
            placeholder="Paste token if needed"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Checking..." : "Validate"}
        </button>
        {validationResult && (
          <div className="space-y-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">
              Validation result
            </p>
            <p>Status: {validationResult.status || "unknown"}</p>
            {validationResult.user && (
              <div className="text-xs text-white/70">
                <p>Name: {validationResult.user.name || "-"}</p>
                <p>Phone: {validationResult.user.phone || "-"}</p>
                <p>Email: {validationResult.user.email || "-"}</p>
              </div>
            )}
            {validationResult.ticket?.id && (
              <p className="text-xs text-white/60">
                Ticket: {validationResult.ticket.id}
              </p>
            )}
            {validationResult.tickets &&
              validationResult.tickets.length > 0 && (
                <p className="text-xs text-white/60">
                  Tickets: {validationResult.tickets.length}
                </p>
              )}
          </div>
        )}
        {result && (
          <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80">
            {result}
          </div>
        )}
      </form>
    </div>
  );
}
