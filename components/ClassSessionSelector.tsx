"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { EventItem } from "../lib/types";

function generateClassDates(
  startDate: string,
  daysOfWeek: number[],
  until?: string,
  occurrences?: number,
) {
  if (!startDate || daysOfWeek.length === 0) return [];

  const dates: string[] = [];
  const start = new Date(startDate);
  const endDate = until
    ? new Date(until)
    : new Date(start.getFullYear(), start.getMonth() + 1, 0);
  const maxOccurrences =
    typeof occurrences === "number" ? occurrences : Number.POSITIVE_INFINITY;

  let cursor = new Date(start);
  let count = 0;
  while (cursor <= endDate && count < maxOccurrences) {
    if (daysOfWeek.includes(cursor.getDay())) {
      dates.push(cursor.toISOString().split("T")[0]);
      count += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function formatSessionDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function ClassSessionSelector({ event }: { event: EventItem }) {
  const router = useRouter();

  const sessions = useMemo(() => {
    const dates = generateClassDates(
      event.date,
      event.repeat?.daysOfWeek || [],
      event.repeat?.until,
      event.repeat?.occurrences ?? undefined,
    );

    return dates.map((date) => {
      const timestamp = Date.parse(`${date}T${event.time || "00:00"}`);
      return {
        date,
        isPast: !Number.isNaN(timestamp) && timestamp < Date.now(),
      };
    });
  }, [event.date, event.repeat, event.time]);

  const upcomingSessions = sessions.filter((session) => !session.isPast);
  const pastSessions = sessions.filter((session) => session.isPast).reverse();
  const eventId = event.id || event._id || "";
  const dropInPrice = event.drop_in_price ?? event.price;

  return (
    <div className="space-y-6 rounded-3xl border border-white/20 bg-black/40 p-6 backdrop-blur-md">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Class Schedule</h2>
          <p className="mt-2 text-sm text-white/70">
            Book the full month or pick a single upcoming session.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
          <p>
            Monthly:{" "}
            <span className="font-semibold text-white">₹{event.price}</span>
          </p>
          <p>
            Drop-in:{" "}
            <span className="font-semibold text-white">₹{dropInPrice}</span>
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Monthly pass</p>
            <p className="text-xs text-white/70">
              Includes {sessions.length} planned class
              {sessions.length === 1 ? "" : "es"}.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              router.push(
                `/checkout?eventId=${encodeURIComponent(String(eventId))}&bookingType=monthly&qty=1`,
              )
            }
            className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
          >
            Book Monthly
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Upcoming classes
            </h3>
            <span className="text-xs uppercase tracking-[0.18em] text-white/50">
              {upcomingSessions.length} session
              {upcomingSessions.length === 1 ? "" : "s"}
            </span>
          </div>
          {upcomingSessions.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              No upcoming sessions.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <div
                  key={session.date}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {formatSessionDate(session.date)}
                    </p>
                    <p className="text-sm text-white/70">{event.time}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/checkout?eventId=${encodeURIComponent(String(eventId))}&bookingType=drop_in&sessionDate=${encodeURIComponent(session.date)}&qty=1`,
                      )
                    }
                    className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/20"
                  >
                    Book Drop-in ₹{dropInPrice}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Past classes</h3>
            <span className="text-xs uppercase tracking-[0.18em] text-white/50">
              {pastSessions.length} session
              {pastSessions.length === 1 ? "" : "s"}
            </span>
          </div>
          {pastSessions.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              No past sessions yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
              {pastSessions.map((session) => (
                <div
                  key={session.date}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-4"
                >
                  <div>
                    <p className="font-semibold text-white/85">
                      {formatSessionDate(session.date)}
                    </p>
                    <p className="text-sm text-white/55">{event.time}</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60">
                    Completed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
