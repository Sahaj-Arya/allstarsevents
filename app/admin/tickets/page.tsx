"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchAllTicketsAdmin,
  fetchTicketByTokenAdmin,
  fetchTicketsByPhoneAdmin,
} from "../../../lib/api";
import {
  TicketInstanceCard,
  TicketItemCard,
} from "../../../components/TicketCard";
import { AdminTicketListItem, Booking } from "../../../lib/types";

export default function AdminTicketsPage() {
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [focusBooking, setFocusBooking] = useState<Booking | null>(null);
  const [focusTicketId, setFocusTicketId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listTickets, setListTickets] = useState<AdminTicketListItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString();
  };

  const loadTicketsList = async () => {
    setListError(null);
    setListLoading(true);
    try {
      const data = await fetchAllTicketsAdmin();
      setListTickets(data.tickets || []);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load list");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    void loadTicketsList();
  }, []);

  const handlePhoneSearch = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await fetchTicketsByPhoneAdmin(phone);
      setBookings(data);
      setFocusBooking(null);
      setFocusTicketId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSearch = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await fetchTicketByTokenAdmin(token);
      setFocusBooking(result.booking);
      setFocusTicketId(result.focusTicketId);
      setBookings(result.booking ? [result.booking] : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Tickets lookup</h1>
          <p className="mt-2 text-sm text-white/70">
            Search tickets by phone number, booking token, or ticket ID.
          </p>
        </div>
        <Link
          href="/admin/validate"
          className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 hover:border-white/40"
        >
          Scanner
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <form
          onSubmit={handlePhoneSearch}
          className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">
            Search by phone
          </p>
          <input
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
          >
            {loading ? "Searching..." : "Find tickets"}
          </button>
        </form>

        <form
          onSubmit={handleTokenSearch}
          className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">
            Search by token / ticket ID
          </p>
          <input
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Ticket token or ticket id"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
          >
            {loading ? "Searching..." : "Find ticket"}
          </button>
        </form>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
          {error}
        </div>
      )}

      {bookings.length > 0 && (
        <div className="mt-6 space-y-6">
          {bookings.map((booking) => (
            <div key={booking.ticketToken} className="space-y-3">
              <h2 className="text-lg font-semibold text-white">
                Booking {booking.ticketToken}
              </h2>
              <div className="flex flex-nowrap gap-3 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible">
                {booking.tickets && booking.tickets.length > 0
                  ? booking.tickets
                      .filter((t) =>
                        focusTicketId ? t.id === focusTicketId : true
                      )
                      .map((t) => <TicketInstanceCard key={t.id} ticket={t} />)
                  : booking.cartItems.map((_, idx) => (
                      <TicketItemCard
                        key={`${booking.ticketToken}-${idx}`}
                        booking={booking}
                        itemIndex={idx}
                      />
                    ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && bookings.length === 0 && focusBooking === null && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
          No tickets found yet.
        </div>
      )}

      <div className="mt-12 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-white">All tickets</h2>
            <p className="mt-1 text-sm text-white/70">
              View ticket status with user phone and name.
            </p>
          </div>
          <button
            type="button"
            onClick={loadTicketsList}
            className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 hover:border-white/40"
          >
            {listLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {listError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {listError}
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <table className="min-w-full text-left text-sm text-white/80">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/60">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Seat</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Scanned at</th>
                <th className="px-4 py-3">Ticket ID</th>
              </tr>
            </thead>
            <tbody>
              {listLoading && (
                <tr>
                  <td colSpan={8} className="px-4 py-4 text-white/60">
                    Loading tickets...
                  </td>
                </tr>
              )}
              {!listLoading && listTickets.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-4 text-white/60">
                    No tickets available.
                  </td>
                </tr>
              )}
              {listTickets.map((ticket) => (
                <tr key={ticket.id} className="border-t border-white/10">
                  <td className="px-4 py-3">{ticket.user?.name || "-"}</td>
                  <td className="px-4 py-3">{ticket.user?.phone || "-"}</td>
                  <td className="px-4 py-3">{ticket.title || "Ticket"}</td>
                  <td className="px-4 py-3">
                    {ticket.date || ""}
                    {ticket.time ? ` · ${ticket.time}` : ""}
                  </td>
                  <td className="px-4 py-3">{ticket.seat || "-"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        ticket.isScanned
                          ? "rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-200"
                          : "rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-white/70"
                      }
                    >
                      {ticket.isScanned ? "Scanned" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/60">
                    {formatDateTime(ticket.scannedAt)}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/60 break-all">
                    {ticket.id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
