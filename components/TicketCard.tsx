"use client";

import QRCode from "react-qr-code";
import { Booking } from "../lib/types";
import { FaShareAlt } from "react-icons/fa";

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
    <div className="w-[260px] min-w-[260px] max-w-[320px] sm:w-[300px] shrink-0 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur">
      <p className="text-xs uppercase tracking-[0.2em] text-white/50">Ticket</p>
      <p className="mt-1 text-base font-semibold text-white">
        {item.event.title}
      </p>
      <p className="mt-1 text-sm text-white/70">
        {item.event.date} · {item.event.time}
      </p>
      <p className="text-sm text-white/70">{item.event.location}</p>
      <div className="mt-2 flex items-center justify-between text-sm text-white/80">
        <span>Qty: {item.quantity}</span>
        <span>₹{item.event.price} each</span>
      </div>
      <p className="mt-2 text-xs text-white/50">Booking: ₹{booking.amount}</p>
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
    scannedAt?: string;
  };
}) {
  const scannedAtLabel = ticket.scannedAt
    ? new Date(ticket.scannedAt).toLocaleString()
    : "";
  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/ticket/${ticket.id}`;
    if (navigator.share) {
      await navigator.share({ title: ticket.title || "Ticket", url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="w-[260px] min-w-[260px] max-w-[320px] sm:w-[300px] shrink-0 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">
            Ticket
          </p>
          <p className="mt-1 text-base font-semibold text-white">
            {ticket.title || "Ticket"}
          </p>
        </div>
        <span
          className={
            ticket.isScanned
              ? "rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-200"
              : "rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-white/70"
          }
        >
          {ticket.isScanned ? "Scanned" : "Active"}
        </span>
        <button
          type="button"
          aria-label="Share ticket"
          title="Share ticket"
          onClick={handleShare}
          className="ml-2 rounded-full border border-white/10 bg-white/5 p-2 text-white/80 transition hover:border-white/30 hover:bg-white/10"
        >
          <FaShareAlt />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/30 p-3">
        <QRCode
          value={ticket.id}
          size={120}
          fgColor="#0b0b0f"
          bgColor="#ffffff"
        />
      </div>

      <p className="mt-1 text-sm text-white/70">
        {ticket.date || ""}
        {ticket.time ? ` · ${ticket.time}` : ""}
      </p>
      <p className="text-sm text-white/70">{ticket.location || ""}</p>
      {ticket.seat && (
        <p className="mt-1 text-sm text-white/80">Seat: {ticket.seat}</p>
      )}
      {ticket.isScanned && scannedAtLabel && (
        <p className="mt-1 text-xs text-emerald-200/80">
          Scanned: {scannedAtLabel}
        </p>
      )}
      <p className="mt-2 text-xs text-white/40">ID: {ticket.id}</p>
    </div>
  );
}

export function TicketCard({ booking }: { booking: Booking }) {
  const firstItem = booking.cartItems[0];
  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/ticket/${booking.ticketToken}`;
    if (navigator.share) {
      await navigator.share({ title: firstItem?.event.title || "Ticket", url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };
  return (
    <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur md:grid-cols-[2fr_1fr]">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-white/50">
          Ticket
        </p>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-white">
            {firstItem?.event.title}
          </h3>
          <button
            type="button"
            aria-label="Share ticket"
            title="Share ticket"
            onClick={handleShare}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-white/80 transition hover:border-white/30 hover:bg-white/10"
          >
            <FaShareAlt />
          </button>
        </div>
        <p className="text-sm text-white/70">
          {firstItem?.event.date} · {firstItem?.event.time}
        </p>
        <p className="text-sm text-white/70">{firstItem?.event.location}</p>
        <p className="text-sm text-white/80">
          Tickets:{" "}
          {booking.cartItems.reduce((sum, ci) => sum + (ci.quantity || 0), 0)}
        </p>
        <p className="text-sm text-white/80">Paid: ₹{booking.amount}</p>
        <p className="text-xs text-white/40">Token: {booking.ticketToken}</p>
      </div>
      <div className="flex items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/30 p-4">
        <QRCode
          value={booking.ticketToken}
          size={160}
          fgColor="#0b0b0f"
          bgColor="#ffffff"
        />
      </div>
    </div>
  );
}
