"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCart } from "../../../lib/cart-context";
import { TicketCard } from "../../../components/TicketCard";

export default function TicketPage() {
  const params = useParams<{ id: string }>();
  const token = params?.id;
  const { bookings } = useCart();

  const booking = useMemo(
    () => bookings.find((b) => b.ticketToken === token),
    [bookings, token]
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-neutral-900">Your ticket</h1>
        <Link
          href="/"
          className="text-sm font-semibold text-neutral-700 underline"
        >
          Back to events
        </Link>
      </div>

      {!booking && (
        <div className="mt-6 rounded-2xl border border-black/5 bg-white p-6 text-neutral-700">
          Ticket not found. Complete a checkout to generate a ticket.
        </div>
      )}

      {booking && (
        <div className="mt-6">
          <TicketCard booking={booking} />
        </div>
      )}
    </div>
  );
}
