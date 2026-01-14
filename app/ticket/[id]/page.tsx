"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCart } from "../../../lib/cart-context";
import {
  TicketCard,
  TicketInstanceCard,
  TicketItemCard,
} from "../../../components/TicketCard";

export default function TicketPage() {
  const params = useParams<{ id: string }>();
  const token = params?.id;
  const { bookings } = useCart();

  const booking = useMemo(
    () => bookings.find((b) => b.ticketToken === token),
    [bookings, token]
  );

  return (
    <div className="mx-auto h-dvh max-w-4xl overflow-y-auto px-6 py-10 scrollbar-hide">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Your ticket</h1>
        <Link
          href="/"
          className="text-sm font-semibold text-white/70 underline decoration-white/30 hover:text-white"
        >
          Back to events
        </Link>
      </div>

      {!booking && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70 backdrop-blur">
          Ticket not found. Complete a checkout to generate a ticket.
        </div>
      )}

      {booking && (
        <div className="mt-6 scrollbar-hide">
          <TicketCard booking={booking} />

          {((booking.tickets && booking.tickets.length > 0) ||
            booking.cartItems.length > 0) && (
            <div className="-mx-6 mt-6 overflow-x-auto px-6 scrollbar-hide">
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
          )}
        </div>
      )}
    </div>
  );
}
