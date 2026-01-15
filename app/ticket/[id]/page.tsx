"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCart } from "../../../lib/cart-context";
import { fetchShareableTicket } from "../../../lib/api";
import {
  TicketCard,
  TicketInstanceCard,
  TicketItemCard,
} from "../../../components/TicketCard";

export default function TicketPage() {
  const params = useParams<{ id: string }>();
  const token = params?.id;
  const { bookings } = useCart();
  const [remoteBooking, setRemoteBooking] = useState<
    (typeof bookings)[0] | null
  >(null);
  const [focusTicketId, setFocusTicketId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const booking = useMemo(
    () => bookings.find((b) => b.ticketToken === token),
    [bookings, token]
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!token) return;
      if (booking) return;
      setLoading(true);
      const fetched = await fetchShareableTicket(token);
      if (mounted) {
        setRemoteBooking((fetched?.booking ?? null) as (typeof bookings)[0]);
        setFocusTicketId(fetched?.focusTicketId ?? null);
        setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [token, booking]);

  const resolvedBooking = booking || remoteBooking;

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

      {loading && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70 backdrop-blur">
          Loading ticket...
        </div>
      )}

      {!loading && !resolvedBooking && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70 backdrop-blur">
          Ticket not found. Complete a checkout to generate a ticket.
        </div>
      )}

      {resolvedBooking &&
        ((resolvedBooking.tickets && resolvedBooking.tickets.length > 0) ||
          resolvedBooking.cartItems.length > 0) && (
          <div className="mt-6 -mx-6 overflow-x-auto px-6 scrollbar-hide">
            <div className="flex snap-x snap-mandatory gap-3 pb-2">
              {resolvedBooking.tickets && resolvedBooking.tickets.length > 0
                ? resolvedBooking.tickets
                    .filter((t) =>
                      focusTicketId ? t.id === focusTicketId : true
                    )
                    .map((t) => <TicketInstanceCard key={t.id} ticket={t} />)
                : resolvedBooking.cartItems.map((_, idx) => (
                    <TicketItemCard
                      key={`${resolvedBooking.ticketToken}-${idx}`}
                      booking={resolvedBooking}
                      itemIndex={idx}
                    />
                  ))}
            </div>
          </div>
        )}
    </div>
  );
}
