"use client";

import { EventItem } from "../lib/types";
import Link from "next/link";
import Image from "next/image";
import { FaMapMarkerAlt } from "react-icons/fa";

function isVideoUrl(url?: string) {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov)$/i.test(url);
}

function generateClassDates(
  startDate: string,
  daysOfWeek: number[],
  until?: string,
  occurrences?: number,
): string[] {
  if (!startDate || daysOfWeek.length === 0) return [];

  const dates: string[] = [];
  const start = new Date(startDate);
  const endDate = until
    ? new Date(until)
    : new Date(start.getFullYear(), start.getMonth() + 1, 0);

  let currentDate = new Date(start);
  let count = 0;
  const maxOccurrences =
    typeof occurrences === "number" ? occurrences : Infinity;

  while (currentDate <= endDate && count < maxOccurrences) {
    const dayOfWeek = currentDate.getDay();
    if (daysOfWeek.includes(dayOfWeek)) {
      dates.push(currentDate.toISOString().split("T")[0]);
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

export function EventCard({ event }: { event: EventItem }) {
  const allAssets = [
    event.photo,
    ...(event.images || []),
    ...(event.media || []),
  ].filter(Boolean) as string[];
  const primaryImage =
    allAssets.find((u) => !isVideoUrl(u)) ||
    event.photo ||
    event.images?.[0] ||
    "";
  const eventSlug = event.id || event._id || "";
  const originalPrice = event.original_price;
  const hasDiscount =
    typeof originalPrice === "number" && originalPrice > event.price;

  const bg =
    primaryImage && primaryImage.startsWith("http")
      ? undefined
      : "linear-gradient(135deg,#0b1224,#121826)";

  // Google Maps search link for location
  const mapsUrl = event.location;

  const isActive = event.isActive !== false;
  const typeLabel =
    event.type === "class"
      ? "Class"
      : event.type === "workshop"
        ? "Workshop"
        : "Event";

  return (
    <div
      className={`group flex flex-col md:flex-row overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-lg backdrop-blur transition w-full min-h-80 ${
        !isActive
          ? "opacity-60 grayscale pointer-events-none"
          : "hover:border-white/30 hover:bg-white/10"
      }`}
    >
      <div className="relative w-full md:w-96 h-72 md:min-h-[24rem] shrink-0 bg-neutral-900">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={event.title}
            fill
            className="object-contain object-center"
            style={{ borderRadius: "1.5rem 0 0 1.5rem" }}
            sizes="(max-width: 768px) 100vw, 384px"
            priority
            quality={60}
          />
        ) : (
          <div className="absolute inset-0" style={{ background: bg }} />
        )}
        <div className="absolute bottom-3 left-3 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
          <div className="flex items-center gap-2">
            {hasDiscount && (
              <span className="text-white/60 line-through">
                ₹ {originalPrice}
              </span>
            )}
            <span>₹ {event.price}</span>
          </div>
        </div>
        {/* <button
          className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 shadow"
          title="Add to cart"
          onClick={() => addItem(event, 1)}
        >
          <FaPlus />
        </button> */}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5 text-white">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
          <span>{typeLabel}</span>
          <span className="h-px flex-1 bg-white/15" />
          <span>
            {event.date} | {event?.time}
          </span>
          {!isActive && (
            <span className="ml-2 rounded bg-red-600/80 px-2 py-0.5 text-xs font-bold text-white">
              Inactive
            </span>
          )}
        </div>
        <h3 className="text-2xl font-bold leading-tight mb-1">{event.title}</h3>

        {/* Show class schedule for recurring classes */}
        {event.type === "class" &&
          event.repeat?.enabled &&
          event.repeat?.frequency === "weekly" &&
          event.repeat?.daysOfWeek &&
          event.repeat.daysOfWeek.length > 0 && (
            <div className="mb-2 rounded-lg border border-white/10 bg-white/5 p-2">
              <p className="text-xs font-semibold text-white/70 mb-1">
                Class Schedule:
              </p>
              <div className="flex flex-wrap gap-1 mb-2">
                {[
                  { day: 0, label: "Sun" },
                  { day: 1, label: "Mon" },
                  { day: 2, label: "Tue" },
                  { day: 3, label: "Wed" },
                  { day: 4, label: "Thu" },
                  { day: 5, label: "Fri" },
                  { day: 6, label: "Sat" },
                ]
                  .filter(({ day }) => event.repeat?.daysOfWeek?.includes(day))
                  .map(({ label }) => (
                    <span
                      key={label}
                      className="rounded-full bg-rose-600/30 px-2 py-0.5 text-xs font-semibold text-rose-200"
                    >
                      {label}
                    </span>
                  ))}
              </div>
              <div className="text-xs text-white/60">
                {generateClassDates(
                  event.date,
                  event.repeat.daysOfWeek,
                  event.repeat.until,
                  event.repeat.occurrences ?? undefined,
                ).length > 0 && (
                  <p>
                    {
                      generateClassDates(
                        event.date,
                        event.repeat.daysOfWeek,
                        event.repeat.until,
                        event.repeat.occurrences ?? undefined,
                      ).length
                    }{" "}
                    sessions planned
                  </p>
                )}
              </div>
            </div>
          )}

        {event.placename && (
          <a
            className="text-sm text-white/70 mb-1"
            href={mapsUrl}
            target="_blank"
          >
            <span className="font-semibold">
              <div
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-300 hover:underline mt-1"
                title="View on Google Maps"
              >
                <FaMapMarkerAlt className="inline-block" />
                {/* <span className="truncate max-w-45 align-middle">
                {event.location}
              </span> */}
              </div>
            </span>{" "}
            {event.placename}
          </a>
        )}
        <p className="text-base text-white/80 line-clamp-3 mb-2">
          {event.description}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-white/80 mt-auto">
          <div className="flex flex-col">
            {/* <span className="font-semibold text-white">{event.time}</span> */}
            {/* <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-300 hover:underline mt-1"
              title="View on Google Maps"
            >
              <FaMapMarkerAlt className="inline-block" />
            
            </a> */}
          </div>
          {isActive && (
            <Link
              href={`/events/${eventSlug}`}
              className="rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:border-white hover:bg-white/20"
            >
              View details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
