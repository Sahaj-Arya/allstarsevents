"use client";

import Link from "next/link";
import { useCart } from "../../lib/cart-context";

export default function ProfilePage() {
  const { bookings } = useCart();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-neutral-900">Profile</h1>
        <Link
          href="/checkout"
          className="text-sm font-semibold text-neutral-700 underline"
        >
          Checkout again
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Auth
          </p>
          <p className="mt-2 text-sm text-neutral-700">
            OTP login to be wired to your backend (/auth/send-otp and
            /auth/verify-otp). Until then, checkout uses inline mock profile
            fields.
          </p>
          <Link
            href="/auth/login"
            className="mt-4 inline-flex rounded-full bg-black px-4 py-2 text-sm font-semibold text-white"
          >
            Open OTP login
          </Link>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-neutral-900">Tickets</p>
          {bookings.length === 0 && (
            <p className="text-sm text-neutral-600">No tickets yet.</p>
          )}
          <div className="mt-3 space-y-3 text-sm text-neutral-700">
            {bookings.map((booking) => (
              <div
                key={booking.ticketToken}
                className="flex items-center justify-between rounded-lg border border-black/5 px-3 py-2"
              >
                <div>
                  <p className="font-semibold text-neutral-900">
                    {booking.cartItems[0]?.event.title}
                  </p>
                  <p className="text-neutral-500">
                    Paid ₹{booking.amount} · {booking.paymentMode}
                  </p>
                </div>
                <Link
                  href={`/ticket/${booking.ticketToken}`}
                  className="text-xs font-semibold underline"
                >
                  View ticket
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
