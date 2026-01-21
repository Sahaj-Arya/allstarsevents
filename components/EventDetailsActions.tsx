"use client";

import { useRouter } from "next/navigation";
import { EventItem } from "../lib/types";
import { useMemo, useState } from "react";

type Props = {
  event: EventItem;
  buttonLabel?: string;
  className?: string;
  hideQuantity?: boolean;
  defaultQuantity?: number;
};

export function EventDetailsActions({
  event,
  buttonLabel = "Book now",
  className = "",
  hideQuantity = false,
  defaultQuantity = 1,
}: Props) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(defaultQuantity);
  const eventId = useMemo(() => event.id || event._id || "", [event]);

  const adjustQuantity = (next: number) => {
    setQuantity(Math.max(1, next));
  };

  const qtyToUse = hideQuantity ? defaultQuantity : quantity;

  return (
    <div className="flex flex-nowrap items-center gap-3">
      {!hideQuantity && (
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
      )}
      <button
        onClick={() => {
          router.push(
            `/checkout?eventId=${encodeURIComponent(eventId)}&qty=${qtyToUse}`,
          );
        }}
        className={`rounded-full px-6 py-2 text-sm font-semibold text-white transition ${className}`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
