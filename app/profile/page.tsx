"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "../../lib/cart-context";
import { UserProfile } from "../../lib/types";
import { BYPASS_OTP, STATIC_OTP, sendOtp, verifyOtp } from "../../lib/otp";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { InputField } from "../../components/ui/InputField";
import { Alert } from "../../components/ui/Alert";
import { PillTabs } from "../../components/ui/PillTabs";
import {
  TicketInstanceCard,
  TicketItemCard,
} from "../../components/TicketCard";
import {
  fetchTickets,
  updateProfileApi,
  fetchUserByPhone,
} from "../../lib/api";
import { useAuth } from "../../lib/auth-context";

export default function ProfilePage() {
  const { bookings, replaceBookings } = useCart();
  const { profile, setProfile } = useAuth();

  const [name, setName] = useState(profile?.name || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [otp, setOtp] = useState("");
  const [otpRequestId, setOtpRequestId] = useState<string | null>(null);
  const [otpStatus, setOtpStatus] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingDetails, setEditingDetails] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  const isAuthed = Boolean(profile);
  const needsDetails = isAuthed && (!profile?.name || !profile?.email);

  const syncTickets = async (token?: string, phoneNumber?: string) => {
    const tickets = await fetchTickets(token, phoneNumber);
    replaceBookings(tickets);
  };

  useEffect(() => {
    if (profile?.phone || profile?.token) {
      void syncTickets(profile.token, profile.phone);
    }
  }, [profile?.phone]);

  const handleSendOtp = async () => {
    setError(null);
    setOtpStatus(null);
    if (!phone) {
      setError("Enter phone number first");
      return;
    }
    setOtpLoading(true);
    const reqId = await sendOtp(phone);
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
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone) {
      setError("Enter phone number");
      return;
    }
    if (mode === "signup" && (!name || !email)) {
      setError("Name and email required for signup");
      return;
    }
    if (!otpRequestId && !BYPASS_OTP) {
      setError("Send OTP first");
      return;
    }
    setOtpLoading(true);
    const verified = await verifyOtp(
      phone,
      otp || STATIC_OTP,
      otpRequestId || "bypass",
      { name, email }
    );
    setOtpLoading(false);
    if (!verified.ok) {
      setError("OTP verification failed");
      return;
    }
    const newProfile: UserProfile = {
      name: name || "Guest",
      email: email || "",
      phone,
      token: verified.token,
      userId: verified.user?._id,
    };
    setProfile(newProfile);
    setName(newProfile.name);
    setEmail(newProfile.email);
    const needs = !(newProfile.name && newProfile.email);
    setOtpStatus(mode === "signup" ? "Signed up via OTP" : "Logged in via OTP");
    setEditingDetails(needs);
    await syncTickets(verified.token, phone);
  };

  const handleLogout = () => {
    setProfile(null);
    replaceBookings([]);
    setName("");
    setEmail("");
    setPhone("");
    setOtp("");
    setOtpRequestId(null);
    setOtpStatus("Logged out");
    setError(null);
    setEditingDetails(false);
    setMode("login");
  };

  const handleSaveDetails = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile?.token) {
      setError("Login again to update profile");
      return;
    }
    try {
      const resp = await updateProfileApi(profile.token, {
        name: name || "Guest",
        email: email || "",
      });
      const updated: UserProfile = {
        name: resp.user?.name || name || "Guest",
        email: resp.user?.email || email || "",
        phone: profile.phone,
        token: resp.token || profile.token,
        userId: resp.user?._id || profile.userId,
      };
      setProfile(updated);
      setEditingDetails(false);
      setOtpStatus("Profile updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  // Fetch user details by phone when phone changes and user is authenticated
  useEffect(() => {
    if (isAuthed && phone.length >= 10) {
      fetchUserByPhone(phone).then(({ user, error, status }) => {
        if (user) {
          setName(user.name || "");
          setEmail(user.email || "");
        } else {
          setName("");
          setEmail("");
          if (error) setError(error + (status ? ` (code ${status})` : ""));
        }
      });
    }
  }, [phone, isAuthed]);

  // Fetch latest user details from backend when authenticated
  useEffect(() => {
    if (isAuthed && profile?.phone) {
      fetchUserByPhone(profile.phone).then(({ user, error, status }) => {
        if (user) {
          setName(user.name || "");
          setEmail(user.email || "");
        } else if (error) {
          setError(error + (status ? ` (code ${status})` : ""));
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, profile?.phone]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-neutral-900">Profile</h1>
        <div className="flex items-center gap-3">
          {isAuthed && (
            <Button variant="secondary" onClick={handleLogout}>
              Logout
            </Button>
          )}
          <Link
            href="/checkout"
            className="text-sm font-semibold text-neutral-700 underline"
          >
            Checkout again
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          {!isAuthed && (
            <>
              <PillTabs
                options={[
                  { value: "login", label: "Login" },
                  { value: "signup", label: "Signup" },
                ]}
                value={mode}
                onChange={(val) => {
                  setMode(val as "login" | "signup");
                  setError(null);
                  setOtpStatus(null);
                }}
              />
              <p className="mt-3 text-sm text-neutral-700">
                {mode === "login"
                  ? "Login with phone + OTP to access your profile and tickets."
                  : "Create an account with phone + OTP, then complete your details."}
                Backend hooks to /auth/send-otp and /auth/verify-otp are ready;
                static/bypass OTP supported via env.
              </p>

              {error && (
                <Alert tone="error" className="mt-3">
                  {error}
                </Alert>
              )}
              {otpStatus && (
                <Alert tone="info" className="mt-3">
                  {otpStatus}
                </Alert>
              )}

              <form onSubmit={handleVerify} className="mt-4 space-y-3">
                {mode === "signup" && (
                  <Alert
                    tone="info"
                    className="border border-dashed border-black/10"
                  >
                    Step 1: Fill details · Step 2: Send OTP · Step 3: Verify
                  </Alert>
                )}

                {mode === "signup" && (
                  <>
                    <InputField
                      label="Name"
                      required
                      requiredMark
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      disabled={!profile?.name}
                    />
                    <InputField
                      label="Email"
                      required
                      requiredMark
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      disabled={!profile?.email}
                    />
                  </>
                )}

                {mode === "login" && (
                  <Alert tone="info" className="border border-black/5">
                    Login with your phone. You can add name/email later.
                  </Alert>
                )}

                <InputField
                  label="Phone"
                  required
                  requiredMark
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isAuthed && !!profile?.phone}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    onClick={handleSendOtp}
                    disabled={otpLoading || !phone}
                  >
                    {otpLoading ? "Sending..." : "Send OTP"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    onClick={handleSendOtp}
                    disabled={otpLoading || !phone}
                  >
                    {otpLoading ? "..." : "Resend"}
                  </Button>
                </div>

                <InputField
                  label="OTP"
                  required
                  requiredMark
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder={STATIC_OTP || "123456"}
                  hint="Use the code sent to your phone. If bypass/static OTP is on, the placeholder shows the accepted code."
                />

                <Button type="submit" fullWidth disabled={otpLoading}>
                  {mode === "login" ? "Login to continue" : "Signup & verify"}
                </Button>
              </form>
            </>
          )}

          {isAuthed && (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                Profile
              </p>
              <p className="text-sm text-neutral-700">
                You are signed in. Review or complete your details below.
              </p>

              {otpStatus && <Alert tone="info">{otpStatus}</Alert>}

              {!editingDetails && !needsDetails && (
                <div className="rounded-xl border border-black/5 bg-neutral-50 p-4 text-sm text-neutral-800">
                  <p className="font-semibold text-neutral-900">
                    {profile?.name}
                  </p>
                  <p className="text-neutral-700">
                    {profile?.email || "No email"}
                  </p>
                  <p className="text-neutral-700">{profile?.phone}</p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => setEditingDetails(true)}
                    >
                      Edit details
                    </Button>
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              )}

              {(editingDetails || needsDetails) && (
                <form onSubmit={handleSaveDetails} className="space-y-3">
                  <InputField
                    label="Name"
                    required
                    requiredMark
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                  <InputField
                    label="Email"
                    required
                    requiredMark
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                  <InputField
                    label="Phone"
                    value={profile?.phone || phone}
                    readOnly
                    hint="Phone is tied to your OTP login. Logout to switch number."
                  />
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="secondary"
                      fullWidth
                      onClick={() => setEditingDetails(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" fullWidth>
                      Save details
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </Card>

        <Card>
          <p className="text-sm font-semibold text-neutral-900">Tickets</p>
          {!isAuthed && (
            <p className="mt-2 text-sm text-neutral-600">
              Login with OTP to view your tickets on this device.
            </p>
          )}
          {isAuthed && bookings.length === 0 && (
            <p className="mt-2 text-sm text-neutral-600">No tickets yet.</p>
          )}
          {isAuthed && (
            <div className="mt-3 max-h-140 space-y-4 overflow-y-auto pr-1 text-sm text-neutral-700">
              {bookings.map((booking) => (
                <div
                  key={booking.ticketToken}
                  className="rounded-xl border border-black/5 bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-neutral-900">
                        Booking ·{" "}
                        {booking.cartItems[0]?.event.title || "Tickets"}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Paid ₹{booking.amount} · {booking.paymentMode}
                        {booking.createdAt
                          ? ` · ${new Date(booking.createdAt).toLocaleString()}`
                          : ""}
                      </p>
                    </div>
                    <Link
                      href={`/ticket/${booking.ticketToken}`}
                      className="text-xs font-semibold underline"
                    >
                      View QR
                    </Link>
                  </div>

                  <div className="-mx-3 mt-3 overflow-x-auto px-3">
                    <div className="flex snap-x snap-mandatory gap-3 pb-2">
                      {booking.tickets && booking.tickets.length > 0
                        ? booking.tickets.map((t) => (
                            <TicketInstanceCard key={t.id} ticket={t} />
                          ))
                        : booking.cartItems.map((_, idx) => (
                            <TicketItemCard
                              key={`${booking.ticketToken}-${idx}`}
                              booking={booking}
                              itemIndex={idx}
                            />
                          ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
