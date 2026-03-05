"use client";

import type { ReactNode } from "react";
import QRCode from "react-qr-code";
import { Booking } from "../lib/types";
import { FaShareAlt, FaMapMarkerAlt } from "react-icons/fa";
import Link from "next/link";

function formatTicketTime(value?: string) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const normalized = raw.toUpperCase().replace(/\s+/g, "");
  const directMatch = normalized.match(/^(\d{1,2})(?::(\d{2}))?(AM|PM)$/);
  if (directMatch) {
    const hours = Number(directMatch[1]);
    const suffix = directMatch[3];
    if (Number.isFinite(hours) && hours >= 1 && hours <= 12) {
      return `${hours}${suffix}`;
    }
  }

  const hhmmMatch = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmmMatch) {
    const hours24 = Number(hhmmMatch[1]);
    if (Number.isFinite(hours24) && hours24 >= 0 && hours24 <= 23) {
      const suffix = hours24 >= 12 ? "PM" : "AM";
      const hours12 = hours24 % 12 || 12;
      return `${hours12}${suffix}`;
    }
  }

  const parsed = new Date(`1970-01-01T${raw}`);
  if (!Number.isNaN(parsed.getTime())) {
    const formatted = parsed.toLocaleTimeString("en-IN", {
      hour: "numeric",
      hour12: true,
    });
    return formatted.replace(/\s+/g, "").toUpperCase();
  }

  return raw;
}

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
        {item.event.photo ? (
          <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-black/20">
            <img
              src={item.event.photo}
              alt={item.event.title || "Event"}
              className="h-28 w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : null}
        <p className="text-base font-semibold text-white break-words text-center">
          {item.event.title}
        </p>
        <p className="text-sm text-white/70 text-center">
          {item.event.date} · {formatTicketTime(item.event.time)}
        </p>
        <p className="text-sm text-white/70 text-center">
          {item.event.venue || item.event.placename || ""}
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
    photo?: string;
    date?: string;
    time?: string;
    price?: number;
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

      {ticket.photo ? (
        <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-black/20">
          <img
            src={ticket.photo}
            alt={ticket.title || "Event"}
            className="h-28 w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}

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
        {ticket.time ? ` · ${formatTicketTime(ticket.time)}` : ""}
      </p>
      <p className="text-sm text-white/80 text-center">
        Booked at: ₹{ticket.price ?? 0}
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
      <p className="text-sm text-white/70 text-center break-words">
        {ticket.location || ""}
      </p>
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
      {firstItem?.event.photo ? (
        <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-black/20">
          <img
            src={firstItem.event.photo}
            alt={firstItem.event.title || "Event"}
            className="h-32 w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}
      <div className="flex items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/30 p-4 w-full">
        <QRCode
          value={booking.ticketToken}
          size={140}
          fgColor="#0b0b0f"
          bgColor="#ffffff"
        />
      </div>
      <p className="text-sm text-white/70 text-center">
        {firstItem?.event.date} · {formatTicketTime(firstItem?.event.time)}
      </p>
      <p className="text-sm text-white/80 text-center">
        Booked at: ₹{firstItem?.event.price ?? 0}
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
      <p className="text-sm text-white/70 text-center break-words">
        {firstItem?.event.location}
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
