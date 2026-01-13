"use client";

import { EventItem } from "../lib/types";
import { useCart } from "../lib/cart-context";
import { useRouter } from "next/navigation";

export function EventCard({ event }: { event: EventItem }) {
  const { addItem } = useCart();
  const router = useRouter();

  const bg =
    event.photo && event.photo.startsWith("http")
      ? undefined
      : "linear-gradient(135deg,#0b1224,#121826)";

  return (
    <div className="group flex overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg backdrop-blur transition hover:border-white/30 hover:bg-white/10">
      <div
        className="relative h-36 w-36 flex-shrink-0 bg-neutral-900"
        style={{ background: bg }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/40" />
        <div className="absolute bottom-3 left-3 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
          ₹{event.price}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 text-white">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
          <span>{event.type}</span>
          <span className="h-px flex-1 bg-white/15" />
          <span>{event.date}</span>
        </div>
        <h3 className="text-lg font-semibold leading-tight">{event.title}</h3>
        <p className="text-sm text-white/70 line-clamp-2">
          {event.description}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-white/80">
          <div className="flex flex-col">
            <span className="font-semibold text-white">{event.time}</span>
            <span className="text-white/60">{event.location}</span>
          </div>
          <button
            onClick={() => {
              addItem(event, 1);
              router.push("/checkout");
            }}
            className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:border-white hover:bg-white/20"
          >
            Book now
          </button>
        </div>
      </div>
    </div>
  );
}
