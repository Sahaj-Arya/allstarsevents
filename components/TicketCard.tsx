"use client";

import QRCode from "react-qr-code";
import { Booking } from "../lib/types";

export function TicketCard({ booking }: { booking: Booking }) {
  const firstItem = booking.cartItems[0];
  return (
    <div className="grid gap-4 rounded-2xl border border-black/5 bg-white p-6 shadow-sm md:grid-cols-[2fr_1fr]">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
          Ticket
        </p>
        <h3 className="text-xl font-semibold text-neutral-900">
          {firstItem?.event.title}
        </h3>
        <p className="text-sm text-neutral-600">
          {firstItem?.event.date} · {firstItem?.event.time}
        </p>
        <p className="text-sm text-neutral-600">{firstItem?.event.location}</p>
        <p className="text-sm text-neutral-800">Qty: {firstItem?.quantity}</p>
        <p className="text-sm text-neutral-800">Paid: ₹{booking.amount}</p>
        <p className="text-xs text-neutral-500">Token: {booking.ticketToken}</p>
      </div>
      <div className="flex items-center justify-center rounded-xl border border-dashed border-black/10 bg-neutral-50 p-4">
        <QRCode
          value={booking.ticketToken}
          size={160}
          fgColor="#111827"
          bgColor="#f9fafb"
        />
      </div>
    </div>
  );
}
