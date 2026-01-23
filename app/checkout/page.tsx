"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "../../lib/cart-context";
import { fetchEventById, fetchTickets, getPaymentMode } from "../../lib/api";
import { startCheckout } from "../../lib/payment";
import { CartItem, EventItem, UserProfile } from "../../lib/types";
import { Button } from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import { InputField } from "../../components/ui/InputField";
import { Alert } from "../../components/ui/Alert";
import { STATIC_OTP, sendOtp, verifyOtp } from "../../lib/otp";
import { useAuth } from "../../lib/auth-context";

function CheckoutContent() {
  const { recordBooking, replaceBookings } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, setProfile } = useAuth();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [eventLoading, setEventLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [modalName, setModalName] = useState(profile?.name || "");
  const [modalEmail, setModalEmail] = useState(profile?.email || "");
  const [showNameEmail, setShowNameEmail] = useState(false);
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

  const cartItems = useMemo<CartItem[]>(() => {
    if (!event) return [];
    return [{ event, quantity }];
  }, [event, quantity]);

  const total = useMemo(() => {
    if (!event) return 0;
    return event.price * quantity;
  }, [event, quantity]);

  const originalPrice = event?.original_price;
  const hasDiscount =
    typeof originalPrice === "number" && !!event && originalPrice > event.price;
  const originalTotal = hasDiscount ? originalPrice * quantity : null;

  useEffect(() => {
    const eventId = searchParams.get("eventId");
    const qty = Number(searchParams.get("qty"));
    if (Number.isFinite(qty) && qty > 0) {
      setQuantity(Math.floor(qty));
    }

    if (!eventId) {
      setEvent(null);
      setEventLoading(false);
      return;
    }

    setEventLoading(true);
    fetchEventById(eventId)
      .then((data) => setEvent(data))
      .finally(() => setEventLoading(false));
  }, [searchParams]);

  const proceedPayment = async (p: UserProfile, items: CartItem[]) => {
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
    if (!event) {
      setError("Select an event to continue");
      return;
    }
    if (profile && profile.token) {
      void proceedPayment(profile, cartItems);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const requestIdToUse = otpRequestId || "bypass";
    if (!otpRequestId) {
      setError("Send OTP first");
      return;
    }
    setOtpLoading(true);
    const verified = await verifyOtp(
      modalPhone,
      otp || STATIC_OTP,
      requestIdToUse,
      showNameEmail ? { name: modalName, email: modalEmail } : undefined,
    );
    setOtpLoading(false);
    if (!verified.ok) {
      // If error indicates user does not exist, show name/email fields
      if (
        verified.error === "USER_NOT_FOUND" ||
        (verified.error && verified.error.toLowerCase().includes("not found"))
      ) {
        setShowNameEmail(true);
        setError(
          "User not found. Please enter your name and email to continue.",
        );
        return;
      }
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
    await proceedPayment(newProfile, cartItems);
  };

  const adjustQuantity = (next: number) => {
    setQuantity(Math.max(1, next));
  };

  const eventSlug = event?.id || event?._id || "";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050506] text-white mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Checkout</h1>
        <Link
          href={eventSlug ? `/events/${eventSlug}` : "/"}
          className="text-sm font-semibold text-white/70 underline decoration-white/30 hover:text-white"
        >
          Back to event
        </Link>
      </div>
      <div className="relative z-10 w-full py-8">
        <form
          onSubmit={handlePayClick}
          className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">
            Tickets
          </p>

          {eventLoading && (
            <p className="text-sm text-white/70">Loading event...</p>
          )}

          {!eventLoading && !event && (
            <p className="text-sm text-white/70">
              No event selected. Go back and pick one event.
            </p>
          )}

          {event && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">
                    {event.title}
                  </p>
                  <p className="text-sm text-white/70 pt-4">
                    {event.date} · {event.time}
                  </p>
                </div>
                <div className="flex items-center rounded-full border border-white/15 bg-black/20">
                  <button
                    type="button"
                    className="px-3 py-1 text-lg text-white/80 hover:text-white"
                    onClick={() => adjustQuantity(quantity - 1)}
                    aria-label="Decrease tickets"
                  >
                    −
                  </button>
                  <span className="px-3 font-semibold text-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="px-3 py-1 text-lg text-white/80 hover:text-white"
                    onClick={() => adjustQuantity(quantity + 1)}
                    aria-label="Increase tickets"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/80">
            {/* <p className="font-semibold text-white">
              On Payment: {paymentMode}
            </p> */}

            <p>
              On successful payment ticket(s) will be sent via SMS or on your
              profile
            </p>
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          <Button type="submit" fullWidth disabled={loading || !event}>
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size={18} />
                <span>Processing...</span>
              </span>
            ) : (
              `Pay ₹${total}`
            )}
          </Button>
        </form>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur mt-6">
          <p className="text-sm font-semibold text-white">Order summary</p>
          {!event && (
            <p className="text-sm text-white/60">No event selected.</p>
          )}
          {event && (
            <div className="flex items-center justify-between text-sm text-white/70">
              <div>
                <p className="font-semibold text-white">{event.title}</p>
                <div className="flex items-center gap-2 text-white/50">
                  {hasDiscount && (
                    <span className="line-through">₹{originalPrice}</span>
                  )}
                  <span>
                    {quantity} x ₹{event.price}
                  </span>
                </div>
              </div>
              <div className="text-right">
                {hasDiscount && originalTotal !== null && (
                  <div className="text-xs text-white/50 line-through">
                    ₹{originalTotal}
                  </div>
                )}
                <p className="font-semibold text-white">₹{total}</p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-dashed border-white/15 pt-4 text-sm font-semibold text-white">
            <span>Total</span>
            <span>₹{total}</span>
          </div>
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
                value={modalPhone}
                label="Phone"
                required
                requiredMark
                inputMode="numeric"
                maxLength={10}
                pattern="[0-9]{10}"
                onChange={(e) => {
                  const val = e.target.value
                    .replace(/[^0-9]/g, "")
                    .slice(0, 10);
                  setModalPhone(val);
                }}
              />
              {showNameEmail && (
                <>
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
                </>
              )}
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
                      // if (BYPASS_OTP) setOtp(STATIC_OTP);
                      // setOtpStatus(
                      //   BYPASS_OTP
                      //     ? `OTP bypassed (using ${STATIC_OTP})`
                      //     : `OTP sent (use ${STATIC_OTP})`
                      // );
                    } else {
                      setOtpStatus("Failed to send OTP");
                    }
                  }}
                  disabled={otpLoading || !modalPhone}
> 
                  {otpLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner size={14} />
                      <span>Sending...</span>
                    </span>
                  ) : (
                    "Send OTP"
                  )}
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
                      // if (BYPASS_OTP) setOtp(STATIC_OTP);
                      // setOtpStatus(
                      //   BYPASS_OTP
                      //     ? `OTP bypassed (using ${STATIC_OTP})`
                      //     : `OTP resent (use ${STATIC_OTP})`
                      // );
                    } else {
                      setOtpStatus("Failed to resend");
                    }
                  }}
                  disabled={otpLoading || !modalPhone}
> 
                  {otpLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner size={12} />
                      <span>...</span>
                    </span>
                  ) : (
                    "Resend"
                  )}
                </Button>
              </div>
              {otpStatus && <Alert tone="info">{otpStatus}</Alert>}

              <InputField
                label="OTP"
                required
                requiredMark
                value={otp}
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]{6}"
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                  setOtp(val);
                }}
                placeholder={"Enter OTP"}
                // hint="Mock OTP flow; integrates with backend /auth/send-otp and /auth/verify-otp."
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
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner size={16} />
                      <span>Processing...</span>
                    </span>
                  ) : (
                    "Verify & Pay"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-6 py-10 text-white/70">
          Loading checkout...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
