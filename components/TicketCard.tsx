"use client";

import type { ReactNode } from "react";
import QRCode from "react-qr-code";
import { Booking } from "../lib/types";
import { FaShareAlt, FaMapMarkerAlt } from "react-icons/fa";
import Link from "next/link";

function TicketShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-full max-w-[360px] rounded-2xl border border-white/10 shadow-sm backdrop-blur overflow-hidden bg-black ${className}`}
    >
      <div className="relative w-full" style={{ height: 120 }}>
        <img
          src="/assets/ticket.png"
          alt="Ticket"
          className="h-full w-full object-contain select-none pointer-events-none"
          draggable={false}
        />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-lg font-bold tracking-[0.4em] drop-shadow-lg uppercase">
          {/* Ticket */}
        </span>
      </div>
      <div className="flex flex-col items-center w-full gap-2 px-4 pb-4 pt-2">
        {children}
      </div>
    </div>
  );
}

export function TicketItemCard({
  booking,
  itemIndex,
}: {
  booking: Booking;
  itemIndex: number;
}) {
  const item = booking.cartItems[itemIndex];
  if (!item) return null;
  const originalPrice = item.event.original_price;
  const hasDiscount =
    typeof originalPrice === "number" && originalPrice > item.event.price;
  // console.log(booking, " booking in ticket item card");

  return (
    <TicketShell className="shrink-0 w-[260px] min-w-[260px] max-w-[320px] sm:w-[300px]">
      <div className="flex flex-col items-center w-full gap-1">
        <p className="text-base font-semibold text-white break-words text-center">
          {item.event.title}
        </p>
        <p className="text-sm text-white/70 text-center">
          {item.event.date} · {item.event.time}
        </p>
        <p className="text-sm text-white/70 break-words text-center">
          {item.event.location}
        </p>
        <div className="flex items-center justify-between text-sm text-white/80 w-full">
          <span>Qty: {item.quantity}</span>
          <span className="flex items-center gap-2">
            {hasDiscount && (
              <span className="text-white/50 line-through">
                ₹{originalPrice}
              </span>
            )}
            <span>₹{item.event.price} each</span>
          </span>
        </div>
        <p className="text-xs text-white/50 w-full text-right">
          Booking: ₹{booking.amount}
        </p>
      </div>
    </TicketShell>
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
    venue?: string;
    placename?: string;
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

  // console.log(ticket, "ticket");

  return (
    <TicketShell className="shrink-0 w-[260px] min-w-[260px] max-w-[320px] sm:w-[300px]">
      <div className="flex items-center justify-between w-full">
        <p className="text-base font-semibold text-white break-words">
          {ticket.title || "Ticket"}
        </p>
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

      <div className="flex items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/30 p-2 w-full">
        <QRCode
          value={ticket.id}
          size={120}
          fgColor="#0b0b0f"
          bgColor="#ffffff"
        />
      </div>

      <p className="text-sm text-white/70 text-center">
        {ticket.date || ""}
        {ticket.time ? ` · ${ticket.time}` : ""}
      </p>
      <div
        className="rounded-2xl pt-2"
        style={{ boxShadow: "0 4px 16px 0 rgba(0,0,0,0)" }}
      >
        <Link
          href={ticket?.location || ""}
          target="_blank"
          rel="noopener noreferrer"
        >
          <p className="mt-0 text-lg font-semibold flex items-center gap-2">
            <FaMapMarkerAlt className="text-white/80" />
            <span>{ticket?.venue || ""}</span>
          </p>
        </Link>
      </div>
      {ticket.seat && (
        <p className="text-sm text-white/80">Seat: {ticket.seat}</p>
      )}
      {ticket.isScanned && scannedAtLabel && (
        <p className="text-xs text-emerald-200/80">Scanned: {scannedAtLabel}</p>
      )}
      <p className="text-xs text-white/40 break-all">ID: {ticket.id}</p>
    </TicketShell>
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
  // console.log(firstItem, "firstitem");

  return (
    <TicketShell>
      <div className="flex items-center justify-between w-full">
        <h3 className="text-xl font-semibold text-white break-words">
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
      <div className="flex items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/30 p-4 w-full">
        <QRCode
          value={booking.ticketToken}
          size={140}
          fgColor="#0b0b0f"
          bgColor="#ffffff"
        />
      </div>
      <p className="text-sm text-white/70 text-center">
        {firstItem?.event.date} · {firstItem?.event.time}
      </p>
      <div
        className="rounded-2xl pt-6"
        style={{ boxShadow: "0 4px 16px 0 rgba(0,0,0,0)" }}
      >
        <p className="text-xs uppercase tracking-[0.2em] text-white/50">AT</p>
        <Link
          href={firstItem?.event?.location}
          target="_blank"
          rel="noopener noreferrer"
        >
          <p className="mt-2 text-lg font-semibold">
            {firstItem?.event?.placename}
          </p>
        </Link>
      </div>
      <p className="text-sm text-white/70 text-center">
        {firstItem?.event.placename}
      </p>
      <p className="text-sm text-white/80 text-center">
        Tickets:{" "}
        {booking.cartItems.reduce((sum, ci) => sum + (ci.quantity || 0), 0)}
      </p>
      <p className="text-sm text-white/80 text-center">
        Paid: ₹{booking.amount}
      </p>
      <p className="text-xs text-white/40 text-center">
        Token: {booking.ticketToken}
      </p>
    </TicketShell>
  );
}
