"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "../../lib/cart-context";
import { UserProfile } from "../../lib/types";
import { STATIC_OTP, sendOtp, verifyOtp } from "../../lib/otp";
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
import { fireAlert } from "../../lib/alerts";
import Head from "next/head";

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

  const syncTickets = useCallback(
    async (token?: string, phoneNumber?: string) => {
      const tickets = await fetchTickets(token, phoneNumber);
      replaceBookings(tickets);
    },
    [replaceBookings],
  );

  useEffect(() => {
    if (profile?.phone || profile?.token) {
      void syncTickets(profile.token, profile.phone);
    }
  }, [profile?.phone, profile?.token, syncTickets]);

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
      setOtpStatus("OTP sent");
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
    if (!otpRequestId) {
      setError("Send OTP first");
      return;
    }
    setOtpLoading(true);
    const verified = await verifyOtp(
      phone,
      otp || STATIC_OTP,
      otpRequestId || "bypass",
      { name, email },
    );
    setOtpLoading(false);
    if (!verified.ok) {
      setError("OTP verification failed");
      fireAlert("error", "OTP verification failed");
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
    fireAlert(
      "success",
      mode === "signup" ? "User signed up" : "User logged in",
    );
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
    fireAlert("info", "Logged out");
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
  }, [isAuthed, profile?.phone]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050506] text-white mx-auto max-w-4xl px-4 py-4">
      <div className="flex flex-row gap-3 justify-between">
        <h1 className="text-2xl sm:text-3xl font-semibold text-white self-center">
          Profile
        </h1>
        <div className="flex items-center">
          {isAuthed && (
            <Button className="h-10" variant="secondary" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </div>
      </div>

      <div className="relative z-10 w-full py-4">
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
              <p className="mt-3 text-sm text-white/70">
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
                  <Alert tone="info" className="border-dashed">
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
                  </>
                )}

                {mode === "login" && (
                  <Alert tone="info">
                    Login with your phone. You can add name/email later.
                  </Alert>
                )}

                <InputField
                  label="Phone"
                  required
                  requiredMark
                  value={phone}
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  onChange={(e) => {
                    const val = e.target.value
                      .replace(/[^0-9]/g, "")
                      .slice(0, 10);
                    setPhone(val);
                  }}
                />
                <div className="flex flex-col gap-2 sm:flex-row">
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
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  onChange={(e) => {
                    const val = e.target.value
                      .replace(/[^0-9]/g, "")
                      .slice(0, 6);
                    setOtp(val);
                  }}
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
            <div className="relative z-10 w-full py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50 pb-4">
                Profile
              </p>
              <p className="text-sm text-white/70 pb-4">
                You are signed in. Review or complete your details below.
              </p>

              {otpStatus && <Alert tone="info">{otpStatus}</Alert>}

              {!editingDetails && !needsDetails && (
                <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/80">
                  <div className="mb-2">
                    <span className="block font-semibold text-white">
                      Name:
                    </span>
                    <span>{profile?.name}</span>
                  </div>
                  <div className="mb-2">
                    <span className="block font-semibold text-white">
                      Email:
                    </span>
                    <span>{profile?.email || "No email"}</span>
                  </div>
                  <div className="mb-2">
                    <span className="block font-semibold text-white">
                      Phone:
                    </span>
                    <span>{profile?.phone}</span>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
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
                    inputMode="numeric"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    readOnly
                    hint="Phone is tied to your OTP login. Logout to switch number."
                  />
                  <div className="flex flex-col gap-2 pt-1 sm:flex-row">
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

        <Card className="relative z-10 w-full py-4">
          <p className="text-sm font-semibold text-white">Tickets</p>
          {!isAuthed && (
            <p className="mt-2 text-sm text-white/60">
              Login with OTP to view your tickets on this device.
            </p>
          )}
          {isAuthed && bookings.length === 0 && (
            <p className="mt-2 text-sm text-white/60">No tickets yet.</p>
          )}
          {isAuthed && (
            <div className="mt-3 max-h-[60vh] space-y-4 overflow-y-auto pr-1 text-sm text-white/70 scrollbar-hide">
              {bookings?.map((booking) => (
                <div
                  key={booking.ticketToken}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-white">
                        Booking ·{" "}
                        {booking.cartItems[0]?.event.title || "Tickets"}
                      </p>
                      <p className="text-xs text-white/50 pt-1">
                        Paid ₹{booking.amount} · {booking.paymentMode}
                        {booking.createdAt
                          ? ` · ${new Date(booking.createdAt).toLocaleString()}`
                          : ""}
                      </p>

                      <p className="text-xs text-white/50 pt-1">
                        Booked for:{" "}
                        {booking.cartItems.reduce(
                          (sum, item) => sum + item.quantity,
                          0,
                        )}{" "}
                        ticket
                        {booking.cartItems.reduce(
                          (sum, item) => sum + item.quantity,
                          0,
                        ) > 1
                          ? "s"
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 -mx-3 overflow-x-auto px-3">
                    <div className="flex flex-nowrap gap-3 pb-2 sm:flex-wrap sm:overflow-visible">
                      {booking?.tickets && booking?.tickets?.length > 0
                        ? booking?.tickets?.map((t) => (
                            <TicketInstanceCard key={t.id} ticket={t} />
                          ))
                        : booking?.cartItems?.map((_, idx) => (
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
