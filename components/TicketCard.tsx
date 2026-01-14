"use client";

import QRCode from "react-qr-code";
import { Booking } from "../lib/types";

export function TicketItemCard({
  booking,
  itemIndex,
}: {
  booking: Booking;
  itemIndex: number;
}) {
  const item = booking.cartItems[itemIndex];
  if (!item) return null;

  return (
    <div className="min-w-65 shrink-0 snap-start rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
        Ticket
      </p>
      <p className="mt-1 text-base font-semibold text-neutral-900">
        {item.event.title}
      </p>
      <p className="mt-1 text-sm text-neutral-600">
        {item.event.date} · {item.event.time}
      </p>
      <p className="text-sm text-neutral-600">{item.event.location}</p>
      <div className="mt-2 flex items-center justify-between text-sm text-neutral-800">
        <span>Qty: {item.quantity}</span>
        <span>₹{item.event.price} each</span>
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        Booking: ₹{booking.amount}
      </p>
    </div>
  );
}

export function TicketInstanceCard({
  ticket,
}: {
  ticket: {
    id: string;
    title?: string;
    date?: string;
    time?: string;
    location?: string;
    seat?: string;
    isScanned: boolean;
  };
}) {
  return (
    <div className="min-w-65 shrink-0 snap-start rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Ticket
          </p>
          <p className="mt-1 text-base font-semibold text-neutral-900">
            {ticket.title || "Ticket"}
          </p>
        </div>
        <span
          className={
            ticket.isScanned
              ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800"
              : "rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-700"
          }
        >
          {ticket.isScanned ? "Scanned" : "Active"}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-center rounded-xl border border-dashed border-black/10 bg-neutral-50 p-3">
        <QRCode
          value={ticket.id}
          size={120}
          fgColor="#111827"
          bgColor="#f9fafb"
        />
      </div>

      <p className="mt-1 text-sm text-neutral-600">
        {ticket.date || ""}
        {ticket.time ? ` · ${ticket.time}` : ""}
      </p>
      <p className="text-sm text-neutral-600">{ticket.location || ""}</p>
      {ticket.seat && (
        <p className="mt-1 text-sm text-neutral-700">Seat: {ticket.seat}</p>
      )}
      <p className="mt-2 text-xs text-neutral-500">ID: {ticket.id}</p>
    </div>
  );
}

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
        <p className="text-sm text-neutral-800">
          Tickets:{" "}
          {booking.cartItems.reduce((sum, ci) => sum + (ci.quantity || 0), 0)}
        </p>
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
