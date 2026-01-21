"use client";

import { CartItem as Item } from "../lib/types";
import { useCart } from "../lib/cart-context";

export function CartItemRow({ item }: { item: Item }) {
  const { updateQuantity, removeItem } = useCart();
  const originalPrice = item.event.original_price;
  const hasDiscount =
    typeof originalPrice === "number" && originalPrice > item.event.price;
  const originalTotal = hasDiscount ? originalPrice * item.quantity : null;

  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-col">
        <p className="text-sm font-semibold text-white">{item.event.title}</p>
        <p className="text-xs text-white/50">
          {item.event.date} · {item.event.time}
        </p>
        <p className="text-xs text-white/50">{item.event.location}</p>
      </div>
      <div className="flex items-center gap-3 text-sm font-semibold">
        <div className="flex items-center rounded-full border border-white/15 bg-black/20">
          <button
            aria-label="Decrease quantity"
            className="px-3 py-1 text-white/80 hover:text-white"
            onClick={() => updateQuantity(item.event.id, item.quantity - 1)}
          >
            −
          </button>
          <span className="px-2 text-white">{item.quantity}</span>
          <button
            aria-label="Increase quantity"
            className="px-3 py-1 text-white/80 hover:text-white"
            onClick={() => updateQuantity(item.event.id, item.quantity + 1)}
          >
            +
          </button>
        </div>
        <div className="w-24 text-right">
          {hasDiscount && originalTotal !== null && (
            <div className="text-xs text-white/50 line-through">
              ₹{originalTotal}
            </div>
          )}
          <div className="text-white">₹{item.event.price * item.quantity}</div>
        </div>
        <button
          className="text-xs font-semibold text-rose-400 hover:text-rose-300"
          onClick={() => removeItem(item.event.id)}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
