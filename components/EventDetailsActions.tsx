"use client";

import { useRouter } from "next/navigation";
import { EventItem } from "../lib/types";
import { useMemo, useState } from "react";

export function EventDetailsActions({ event }: { event: EventItem }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const eventId = useMemo(() => event.id || event._id || "", [event]);

  const adjustQuantity = (next: number) => {
    setQuantity(Math.max(1, next));
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-2 py-1">
        <button
          type="button"
          className="px-2 text-lg text-white/80 hover:text-white"
          onClick={() => adjustQuantity(quantity - 1)}
          aria-label="Decrease tickets"
        >
          −
        </button>
        <span className="px-2 text-sm font-semibold text-white">
          {quantity}
        </span>
        <button
          type="button"
          className="px-2 text-lg text-white/80 hover:text-white"
          onClick={() => adjustQuantity(quantity + 1)}
          aria-label="Increase tickets"
        >
          +
        </button>
      </div>
      <button
        onClick={() => {
          router.push(
            `/checkout?eventId=${encodeURIComponent(eventId)}&qty=${quantity}`
          );
        }}
        className="rounded-full bg-rose-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
      >
        Book now
      </button>
    </div>
  );
}
