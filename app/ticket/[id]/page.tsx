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
    [bookings, token],
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!token) return;
      if (booking && (booking.tickets?.length || booking.cartItems.length)) {
        return;
      }
      setLoading(true);
      try {
        const fetched = await fetchShareableTicket(token);
        if (mounted) {
          setRemoteBooking((fetched?.booking ?? null) as (typeof bookings)[0]);
          setFocusTicketId(fetched?.focusTicketId ?? null);
        }
      } catch (err) {
        if (mounted) {
          setRemoteBooking(null);
          setFocusTicketId(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [token, booking]);

  const resolvedBooking = booking || remoteBooking;

  return (
    <div className="mx-auto min-h-svh max-w-5xl px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-semibold text-white">
          Your ticket
        </h1>
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
          <div className="mt-6">
            <div className="flex flex-nowrap gap-3 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible">
              {resolvedBooking.tickets && resolvedBooking.tickets.length > 0
                ? resolvedBooking.tickets
                    .filter((t) =>
                      focusTicketId ? t.id === focusTicketId : true,
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
