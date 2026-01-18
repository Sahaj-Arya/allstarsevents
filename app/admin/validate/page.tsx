"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { validateTicket } from "../../../lib/api";

export default function ValidatePage() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const startInProgressRef = useRef(false);
  const lastScanRef = useRef<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>(
    [],
  );
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
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
    try {
      const res = await validateTicket(value);
      if (!res) {
        setValidationResult({ status: "error", error: "No response" });
        return;
      }
      setValidationResult(res);
      if (res.error) setScannerError(res.error);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Validation request failed";
      setValidationResult({ status: "error", error: message });
      setScannerError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (e: FormEvent) => {
    e.preventDefault();
    await runValidation(token);
  };

  useEffect(() => {
    let mounted = true;

    const loadCameras = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!mounted) return;
        const normalized = (devices || []).map((d, idx) => ({
          id: d.id || `${idx}`,
          label: d.label || `Camera ${idx + 1}`,
        }));
        setCameras(normalized);
        if (!selectedCameraId && normalized.length > 0) {
          const backCamera = normalized.find((cam) =>
            /back|rear|environment/i.test(cam.label),
          );
          setSelectedCameraId(backCamera?.id || normalized[0].id);
        }
      } catch (err) {
        if (mounted) {
          setScannerError(
            err instanceof Error ? err.message : "Failed to list cameras",
          );
        }
      }
    };

    loadCameras();

    return () => {
      mounted = false;
    };
  }, [selectedCameraId]);

  useEffect(() => {
    let cancelled = false;

    const stopScanner = async () => {
      if (!scannerRef.current) return;
      try {
        await scannerRef.current.stop();
      } catch {
        // ignore
      }
      try {
        scannerRef.current.clear();
      } catch {
        // ignore
      }
    };

    const startScanner = async () => {
      if (startInProgressRef.current) return;
      startInProgressRef.current = true;
      setScannerError(null);
      setValidationResult(null);
      lastScanRef.current = null;
      try {
        if (typeof window !== "undefined") {
          const isLocalhost =
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1";
          if (!window.isSecureContext && !isLocalhost) {
            setScannerError(
              "Camera requires HTTPS on mobile browsers. Use HTTPS or localhost.",
            );
            setScannerActive(false);
            return;
          }
        }

        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode("qr-reader");
        } else {
          await stopScanner();
        }

        const onScanSuccess = async (decodedText: string) => {
          if (cancelled) return;
          if (lastScanRef.current === decodedText) return;
          lastScanRef.current = decodedText;
          setToken(decodedText);
          await runValidation(decodedText);
          setScannerActive(false);
        };

        const config = selectedCameraId
          ? { deviceId: { exact: selectedCameraId } }
          : { facingMode: "environment" };

        const scanConfig = {
          fps: 8,
          qrbox: (viewfinderWidth: number) => {
            const size = Math.floor(viewfinderWidth * 0.75);
            return { width: size, height: size };
          },
          aspectRatio: 4 / 3,
          disableFlip: false,
        };

        try {
          await scannerRef.current.start(
            config,
            scanConfig,
            onScanSuccess,
            () => undefined,
          );
        } catch {
          await scannerRef.current.start(
            { facingMode: "environment" },
            scanConfig,
            onScanSuccess,
            () => undefined,
          );
        }
      } catch (err) {
        if (!cancelled) {
          setScannerError(
            err instanceof Error ? err.message : "Failed to start scanner",
          );
          setScannerActive(false);
        }
      } finally {
        startInProgressRef.current = false;
      }
    };

    if (!scannerActive) {
      stopScanner();
      return () => {
        cancelled = true;
      };
    }

    startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [scannerActive, selectedCameraId]);

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
        {cameras.length > 0 && (
          <label className="block text-xs text-white/70">
            Camera
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            >
              {cameras.map((cam) => (
                <option key={cam.id} value={cam.id}>
                  {cam.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <div
          id="qr-reader"
          className="w-full overflow-hidden rounded-xl border border-white/10 bg-black/40"
          style={{ minHeight: 240 }}
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
          <div className="space-y-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">
              Result
            </p>
            <p>Status: {validationResult.status || "unknown"}</p>
            {validationResult.error && (
              <p className="text-xs text-rose-200">
                Error: {validationResult.error}
              </p>
            )}
            {validationResult.user?.name && (
              <p className="text-xs text-white/70">
                Attendee: {validationResult.user.name}
              </p>
            )}
            {validationResult.user?.phone && (
              <p className="text-xs text-white/70">
                Phone: {validationResult.user.phone}
              </p>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
