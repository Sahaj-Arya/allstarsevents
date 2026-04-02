"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchEvents,
  fetchClassAttendanceByDayAdmin,
  fetchAttendanceHistoryAdmin,
  fetchAttendanceRosterAdmin,
  fetchAllTicketsAdmin,
  fetchTicketByTokenAdmin,
  fetchTicketsByPhoneAdmin,
} from "../../../lib/api";
import {
  TicketInstanceCard,
  TicketItemCard,
} from "../../../components/TicketCard";
import {
  AdminTicketListItem,
  AttendanceRecord,
  AttendanceRosterRow,
  Booking,
  ClassDayAttendanceSession,
  EventItem,
} from "../../../lib/types";

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
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventLoading, setEventLoading] = useState(false);
  const [listEventId, setListEventId] = useState("");
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [attendanceEventId, setAttendanceEventId] = useState("");
  const [attendanceSessionDate, setAttendanceSessionDate] = useState("");
  const [rosterRows, setRosterRows] = useState<AttendanceRosterRow[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [rosterEventId, setRosterEventId] = useState("");
  const [rosterSessionDate, setRosterSessionDate] = useState("");
  const [classDay, setClassDay] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [classDayLoading, setClassDayLoading] = useState(false);
  const [classDayError, setClassDayError] = useState<string | null>(null);
  const [classDaySessions, setClassDaySessions] = useState<
    ClassDayAttendanceSession[]
  >([]);
  const [classDayTotals, setClassDayTotals] = useState({
    total: 0,
    present: 0,
    absent: 0,
    dropInTotal: 0,
    dropInPresent: 0,
    dropInAbsent: 0,
  });

  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString();
  };

  const loadTicketsList = async () => {
    setListError(null);
    setListLoading(true);
    try {
      const data = await fetchAllTicketsAdmin(1, 200, {
        eventId: listEventId || undefined,
      });
      setListTickets(data.tickets || []);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load list");
    } finally {
      setListLoading(false);
    }
  };

  const loadAttendance = async () => {
    setAttendanceError(null);
    setAttendanceLoading(true);
    try {
      const data = await fetchAttendanceHistoryAdmin({
        eventId: attendanceEventId || undefined,
        sessionDate: attendanceSessionDate || undefined,
      });
      setAttendance(data.records || []);
    } catch (err) {
      setAttendanceError(
        err instanceof Error ? err.message : "Failed to load attendance",
      );
    } finally {
      setAttendanceLoading(false);
    }
  };

  const loadRoster = async () => {
    if (!rosterEventId.trim()) {
      setRosterError("Event ID is required for roster view");
      return;
    }
    setRosterError(null);
    setRosterLoading(true);
    try {
      const data = await fetchAttendanceRosterAdmin({
        eventId: rosterEventId.trim(),
        sessionDate: rosterSessionDate || undefined,
      });
      setRosterRows(data.rows || []);
    } catch (err) {
      setRosterError(
        err instanceof Error ? err.message : "Failed to load roster",
      );
    } finally {
      setRosterLoading(false);
    }
  };

  const loadClassDayAttendance = async () => {
    setClassDayError(null);
    setClassDayLoading(true);
    try {
      const data = await fetchClassAttendanceByDayAdmin(classDay);
      setClassDaySessions(data.sessions || []);
      setClassDayTotals(
        data.totals || {
          total: 0,
          present: 0,
          absent: 0,
          dropInTotal: 0,
          dropInPresent: 0,
          dropInAbsent: 0,
        },
      );
    } catch (err) {
      setClassDayError(
        err instanceof Error ? err.message : "Failed to load class attendance",
      );
    } finally {
      setClassDayLoading(false);
    }
  };

  const exportAttendanceCsv = () => {
    const headers = [
      "Scanned At",
      "User",
      "Phone",
      "Email",
      "Event ID",
      "Event Title",
      "Event Type",
      "Booking Type",
      "Session Date",
      "Time",
      "Ticket ID",
      "Booking Token",
      "Scan Source",
    ];

    const rows = attendance.map((record) => [
      record.scannedAt || "",
      record.userName || "",
      record.userPhone || "",
      record.userEmail || "",
      record.eventId || "",
      record.eventTitle || "",
      record.eventType || "",
      record.bookingType || "",
      record.sessionDate || record.date || "",
      record.time || "",
      record.ticketId || "",
      record.bookingToken || "",
      record.scanSource || "",
    ]);

    const csv = [headers, ...rows]
      .map((line) =>
        line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const loadEvents = async () => {
      setEventLoading(true);
      try {
        const data = await fetchEvents();
        setEvents(data || []);
      } finally {
        setEventLoading(false);
      }
    };

    void loadEvents();
    void loadTicketsList();
    void loadAttendance();
    void loadClassDayAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uniqueScannedUsers = new Set(
    attendance
      .map((record) => record.userPhone || record.userEmail || "")
      .filter(Boolean),
  ).size;
  const uniqueSessions = new Set(
    attendance.map(
      (record) =>
        `${record.eventId}|${record.sessionDate || record.date || ""}`,
    ),
  ).size;
  const dropInCount = attendance.filter(
    (record) => record.bookingType === "drop_in",
  ).length;

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
                        focusTicketId ? t.id === focusTicketId : true,
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

        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.2em] text-white/60">
              Find by event
            </span>
            <select
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              value={listEventId}
              onChange={(e) => setListEventId(e.target.value)}
            >
              <option value="">All events</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} ({event.id})
                </option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2 flex items-end gap-3">
            <button
              type="button"
              onClick={loadTicketsList}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
            >
              {listLoading ? "Finding..." : "Find"}
            </button>
            {eventLoading && (
              <p className="text-xs text-white/60">Loading events...</p>
            )}
          </div>
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
                <th className="px-4 py-3">Type</th>
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
                  <td colSpan={9} className="px-4 py-4 text-white/60">
                    Loading tickets...
                  </td>
                </tr>
              )}
              {!listLoading && listTickets.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-4 text-white/60">
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
                    {ticket.bookingType === "drop_in" ? "Drop-in" : "Monthly"}
                  </td>
                  <td className="px-4 py-3">
                    {ticket.sessionDate || ticket.date || ""}
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

      <div className="mt-12 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Class attendance by day
          </h2>
          <p className="mt-1 text-sm text-white/70">
            Shows class sessions happened on the selected date (past/today),
            with present/absent and drop-in attendance.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <input
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            value={classDay}
            onChange={(e) => setClassDay(e.target.value)}
          />
          <button
            type="button"
            onClick={loadClassDayAttendance}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
          >
            {classDayLoading ? "Loading..." : "Load day attendance"}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-xs text-white/50">Total</p>
            <p className="text-xl font-semibold text-white">
              {classDayTotals.total}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-xs text-white/50">Present</p>
            <p className="text-xl font-semibold text-emerald-200">
              {classDayTotals.present}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-xs text-white/50">Absent</p>
            <p className="text-xl font-semibold text-amber-200">
              {classDayTotals.absent}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-xs text-white/50">Drop-ins</p>
            <p className="text-xl font-semibold text-white">
              {classDayTotals.dropInTotal}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-xs text-white/50">Drop-in present</p>
            <p className="text-xl font-semibold text-emerald-200">
              {classDayTotals.dropInPresent}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-xs text-white/50">Drop-in absent</p>
            <p className="text-xl font-semibold text-amber-200">
              {classDayTotals.dropInAbsent}
            </p>
          </div>
        </div>

        {classDayError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {classDayError}
          </div>
        )}

        <div className="space-y-3">
          {!classDayLoading && classDaySessions.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              No class sessions found for this day.
            </div>
          )}
          {classDaySessions.map((session) => (
            <div
              key={`${session.eventId}-${session.sessionDate}`}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {session.eventTitle} ({session.eventId})
                  </p>
                  <p className="text-xs text-white/60">
                    {session.sessionDate}
                    {session.time ? ` · ${session.time}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-200">
                    Present {session.present}
                  </span>
                  <span className="rounded-full bg-amber-500/20 px-2 py-1 text-amber-200">
                    Absent {session.absent}
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-white/80">
                    Drop-ins {session.dropInTotal}
                  </span>
                </div>
              </div>

              {session.absentUsers.length > 0 && (
                <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                  <p className="text-xs uppercase tracking-[0.15em] text-amber-200">
                    Absent users
                  </p>
                  <div className="mt-2 grid gap-1 text-xs text-amber-100/90 sm:grid-cols-2">
                    {session.absentUsers.map((user) => (
                      <p key={user.ticketId}>
                        {user.userName || "Unknown"}
                        {user.userPhone ? ` · ${user.userPhone}` : ""}
                        {user.bookingType === "drop_in"
                          ? " · Drop-in"
                          : " · Monthly"}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Attendance history
            </h2>
            <p className="mt-1 text-sm text-white/70">
              Every successful scan is tracked per user and per class/event
              session.
            </p>
          </div>
          <button
            type="button"
            onClick={loadAttendance}
            className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 hover:border-white/40"
          >
            {attendanceLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-xs uppercase tracking-[0.15em] text-white/50">
              Scans
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {attendance.length}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-xs uppercase tracking-[0.15em] text-white/50">
              Users
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {uniqueScannedUsers}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-xs uppercase tracking-[0.15em] text-white/50">
              Sessions
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {uniqueSessions}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-xs uppercase tracking-[0.15em] text-white/50">
              Drop-ins
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {dropInCount}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <select
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            value={attendanceEventId}
            onChange={(e) => setAttendanceEventId(e.target.value)}
          >
            <option value="">All events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title} ({event.id})
              </option>
            ))}
          </select>
          <input
            type="date"
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            value={attendanceSessionDate}
            onChange={(e) => setAttendanceSessionDate(e.target.value)}
          />
          <button
            type="button"
            onClick={loadAttendance}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Apply filters
          </button>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={exportAttendanceCsv}
            disabled={attendance.length === 0}
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Export CSV
          </button>
        </div>

        {attendanceError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {attendanceError}
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <table className="min-w-full text-left text-sm text-white/80">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/60">
              <tr>
                <th className="px-4 py-3">Scanned at</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Ticket</th>
              </tr>
            </thead>
            <tbody>
              {attendanceLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-white/60">
                    Loading attendance...
                  </td>
                </tr>
              )}
              {!attendanceLoading && attendance.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-white/60">
                    No attendance records yet.
                  </td>
                </tr>
              )}
              {attendance.map((record) => (
                <tr key={record.id} className="border-t border-white/10">
                  <td className="px-4 py-3 text-xs text-white/60">
                    {formatDateTime(record.scannedAt)}
                  </td>
                  <td className="px-4 py-3">{record.userName || "-"}</td>
                  <td className="px-4 py-3">{record.userPhone || "-"}</td>
                  <td className="px-4 py-3">
                    {record.eventTitle || record.eventId}
                  </td>
                  <td className="px-4 py-3">
                    {record.eventType === "class"
                      ? record.bookingType === "drop_in"
                        ? "Class (Drop-in)"
                        : "Class (Monthly)"
                      : record.eventType}
                  </td>
                  <td className="px-4 py-3">
                    {record.sessionDate || record.date || ""}
                    {record.time ? ` · ${record.time}` : ""}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/60 break-all">
                    {record.ticketId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-12 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Session roster</h2>
          <p className="mt-1 text-sm text-white/70">
            Present/absent list for a specific event/class session.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <select
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            value={rosterEventId}
            onChange={(e) => setRosterEventId(e.target.value)}
          >
            <option value="">Select event (required)</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title} ({event.id})
              </option>
            ))}
          </select>
          <input
            type="date"
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            value={rosterSessionDate}
            onChange={(e) => setRosterSessionDate(e.target.value)}
          />
          <button
            type="button"
            onClick={loadRoster}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
          >
            {rosterLoading ? "Loading..." : "Load roster"}
          </button>
        </div>

        {rosterError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {rosterError}
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <table className="min-w-full text-left text-sm text-white/80">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/60">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Scanned at</th>
                <th className="px-4 py-3">Ticket</th>
              </tr>
            </thead>
            <tbody>
              {rosterLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-white/60">
                    Loading roster...
                  </td>
                </tr>
              )}
              {!rosterLoading && rosterRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-white/60">
                    No roster rows.
                  </td>
                </tr>
              )}
              {rosterRows.map((row) => (
                <tr key={row.ticketId} className="border-t border-white/10">
                  <td className="px-4 py-3">{row.userName || "-"}</td>
                  <td className="px-4 py-3">{row.userPhone || "-"}</td>
                  <td className="px-4 py-3">
                    {row.sessionDate || ""}
                    {row.time ? ` · ${row.time}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        row.status === "present"
                          ? "rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-200"
                          : "rounded-full bg-amber-500/20 px-2 py-1 text-xs font-semibold text-amber-200"
                      }
                    >
                      {row.status === "present" ? "Present" : "Absent"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/60">
                    {formatDateTime(row.scannedAt)}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/60 break-all">
                    {row.ticketId}
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
