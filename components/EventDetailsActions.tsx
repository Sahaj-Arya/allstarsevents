"use client";

import { useRouter } from "next/navigation";
import { useCart } from "../lib/cart-context";
import { EventItem } from "../lib/types";

export function EventDetailsActions({ event }: { event: EventItem }) {
  const { addItem } = useCart();
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => addItem(event, 1)}
        className="rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
      >
        Add to cart
      </button>
      <button
        onClick={() => {
          addItem(event, 1);
          router.push("/checkout");
        }}
        className="rounded-full bg-rose-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
      >
        Book now
      </button>
    </div>
  );
}
