"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "../../lib/cart-context";
import { fetchTickets, getPaymentMode } from "../../lib/api";
import { startCheckout } from "../../lib/payment";
import { UserProfile } from "../../lib/types";
import { Button } from "../../components/ui/Button";
import { InputField } from "../../components/ui/InputField";
import { Alert } from "../../components/ui/Alert";
import { BYPASS_OTP, STATIC_OTP, sendOtp, verifyOtp } from "../../lib/otp";
import { useAuth } from "../../lib/auth-context";

export default function CheckoutPage() {
  const { items, total, recordBooking, updateQuantity, replaceBookings } =
    useCart();
  const router = useRouter();
  const { profile, setProfile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [modalName, setModalName] = useState(profile?.name || "");
  const [modalEmail, setModalEmail] = useState(profile?.email || "");
  const [modalPhone, setModalPhone] = useState(profile?.phone || "");
  const [otp, setOtp] = useState("");
  const [otpRequestId, setOtpRequestId] = useState<string | null>(null);
  const [otpStatus, setOtpStatus] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const paymentMode = getPaymentMode();

  const syncTickets = async (token?: string, phone?: string) => {
    const tickets = await fetchTickets(token, phone);
    replaceBookings(tickets);
  };

  useEffect(() => {
    if (profile?.phone || profile?.token)
      void syncTickets(profile.token, profile.phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.phone]);

  const proceedPayment = async (p: UserProfile) => {
    if (!p.token) {
      setError("Please login again to continue");
      setShowAuthModal(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const booking = await startCheckout(items, p);
      // booking.cartItems now have ticketIds for each cart item
      recordBooking(booking);
      router.push(`/ticket/${booking.ticketToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePayClick = (e: FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError("Add at least one event");
      return;
    }
    if (profile && profile.token) {
      void proceedPayment(profile);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const requestIdToUse = otpRequestId || "bypass";
    if (!otpRequestId && !BYPASS_OTP) {
      setError("Send OTP first");
      return;
    }
    setOtpLoading(true);
    const verified = await verifyOtp(
      modalPhone,
      otp || STATIC_OTP,
      requestIdToUse,
      { name: modalName, email: modalEmail }
    );
    setOtpLoading(false);
    if (!verified.ok) {
      setError("OTP verification failed");
      return;
    }
    const newProfile: UserProfile = {
      name: modalName || "Guest",
      email: modalEmail || "",
      phone: modalPhone,
      token: verified.token,
      userId: verified.user?._id,
    };
    setProfile(newProfile);
    await syncTickets(verified.token, modalPhone);
    setShowAuthModal(false);
    await proceedPayment(newProfile);
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Checkout</h1>
        <Link
          href="/cart"
          className="text-sm font-semibold text-white/70 underline decoration-white/30 hover:text-white"
        >
          Back to selection
        </Link>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1.6fr_1fr]">
        <form
          onSubmit={handlePayClick}
          className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">
            Tickets
          </p>

          {items.length === 0 && (
            <p className="text-sm text-white/70">
              No event selected. Go back and pick one event.
            </p>
          )}

          {items.map((item) => (
            <div key={item.event.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">
                    {item.event.title}
                  </p>
                  <p className="text-sm text-white/70">
                    {item.event.date} · {item.event.time}
                  </p>
                  <p className="text-xs text-white/50">{item.event.location}</p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/20">
                  <button
                    type="button"
                    className="px-3 py-1 text-lg text-white/80 hover:text-white"
                    onClick={() =>
                      updateQuantity(
                        item.event.id,
                        Math.max(1, item.quantity - 1)
                      )
                    }
                    aria-label="Decrease tickets"
                  >
                    −
                  </button>
                  <span className="px-3 font-semibold text-white">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="px-3 py-1 text-lg text-white/80 hover:text-white"
                    onClick={() =>
                      updateQuantity(item.event.id, item.quantity + 1)
                    }
                    aria-label="Increase tickets"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/80">
            <p className="font-semibold text-white">
              Payment mode: {paymentMode}
            </p>
            {paymentMode === "MOCK" ? (
              <p>
                Instant success. Switch to RAZORPAY when the backend key +
                webhook are ready.
              </p>
            ) : (
              <p>
                Razorpay flow will trigger a hosted payment window. Keep the key
                and backend online.
              </p>
            )}
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Processing..." : `Pay ₹${total}`}
          </Button>
        </form>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur">
          <p className="text-sm font-semibold text-white">Order summary</p>
          {items.length === 0 && (
            <p className="text-sm text-white/60">No items in cart.</p>
          )}
          {items?.map((item) => (
            <div
              key={item?.event?._id}
              className="flex items-center justify-between text-sm text-white/70"
            >
              <div>
                <p className="font-semibold text-white">{item.event.title}</p>
                <p className="text-white/50">
                  {item.quantity} x ₹{item.event.price}
                </p>
              </div>
              <p className="font-semibold text-white">
                ₹{item.event.price * item.quantity}
              </p>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-dashed border-white/15 pt-4 text-sm font-semibold text-white">
            <span>Total</span>
            <span>₹{total}</span>
          </div>
          <p className="text-xs text-white/50">
            Payments are mocked until Razorpay mode is enabled. Backend
            endpoints are prepared: /payment/create-order and /payment/verify.
          </p>
        </div>
      </div>

      {showAuthModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/60 p-6 shadow-xl backdrop-blur">
            <h2 className="text-xl font-semibold text-white">
              Complete with OTP
            </h2>
            <p className="text-sm text-white/70">
              If you&apos;re signed in, this would auto-skip. Otherwise enter
              details and verify via OTP.
            </p>
            <form onSubmit={handleAuthSubmit} className="mt-4 space-y-3">
              <InputField
                label="Name"
                required
                requiredMark
                value={modalName}
                onChange={(e) => setModalName(e.target.value)}
              />
              <InputField
                label="Email"
                type="email"
                value={modalEmail}
                onChange={(e) => setModalEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <InputField
                label="Phone"
                required
                requiredMark
                value={modalPhone}
                onChange={(e) => setModalPhone(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={async () => {
                    setOtpStatus(null);
                    setOtpLoading(true);
                    const reqId = await sendOtp(modalPhone);
                    setOtpLoading(false);
                    if (reqId) {
                      setOtpRequestId(reqId);
                      if (BYPASS_OTP) setOtp(STATIC_OTP);
                      setOtpStatus(
                        BYPASS_OTP
                          ? `OTP bypassed (using ${STATIC_OTP})`
                          : `OTP sent (use ${STATIC_OTP})`
                      );
                    } else {
                      setOtpStatus("Failed to send OTP");
                    }
                  }}
                  disabled={otpLoading || !modalPhone}
                >
                  {otpLoading ? "Sending..." : "Send OTP"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={async () => {
                    if (!otpRequestId) return;
                    setOtpLoading(true);
                    const reqId = await sendOtp(modalPhone);
                    setOtpLoading(false);
                    if (reqId) {
                      setOtpRequestId(reqId);
                      if (BYPASS_OTP) setOtp(STATIC_OTP);
                      setOtpStatus(
                        BYPASS_OTP
                          ? `OTP bypassed (using ${STATIC_OTP})`
                          : `OTP resent (use ${STATIC_OTP})`
                      );
                    } else {
                      setOtpStatus("Failed to resend");
                    }
                  }}
                  disabled={otpLoading || !modalPhone}
                >
                  {otpLoading ? "..." : "Resend"}
                </Button>
              </div>
              {otpStatus && <Alert tone="info">{otpStatus}</Alert>}

              <InputField
                label="OTP"
                required
                requiredMark
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder={STATIC_OTP || "123456"}
                hint="Mock OTP flow; integrates with backend /auth/send-otp and /auth/verify-otp."
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowAuthModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  fullWidth
                  disabled={loading || otpLoading}
                >
                  {loading ? "Processing..." : "Verify & Pay"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
