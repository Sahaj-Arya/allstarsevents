"use client";

import { CartItem as Item } from "../lib/types";
import { useCart } from "../lib/cart-context";

export function CartItemRow({ item }: { item: Item }) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex items-center justify-between rounded-xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex flex-col">
        <p className="text-sm font-semibold text-neutral-900">
          {item.event.title}
        </p>
        <p className="text-xs text-neutral-500">
          {item.event.date} · {item.event.time}
        </p>
        <p className="text-xs text-neutral-500">{item.event.location}</p>
      </div>
      <div className="flex items-center gap-3 text-sm font-semibold">
        <div className="flex items-center rounded-full border border-black/10">
          <button
            aria-label="Decrease quantity"
            className="px-3 py-1 text-neutral-700"
            onClick={() => updateQuantity(item.event.id, item.quantity - 1)}
          >
            −
          </button>
          <span className="px-2 text-neutral-900">{item.quantity}</span>
          <button
            aria-label="Increase quantity"
            className="px-3 py-1 text-neutral-700"
            onClick={() => updateQuantity(item.event.id, item.quantity + 1)}
          >
            +
          </button>
        </div>
        <p className="w-20 text-right text-neutral-900">
          ₹{item.event.price * item.quantity}
        </p>
        <button
          className="text-xs font-semibold text-red-600"
          onClick={() => removeItem(item.event.id)}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
