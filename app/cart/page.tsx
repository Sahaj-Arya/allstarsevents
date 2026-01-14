"use client";

import Link from "next/link";
import { CartItemRow } from "../../components/CartItemRow";
import { useCart } from "../../lib/cart-context";

export default function CartPage() {
  const { items, total } = useCart();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Your selection</h1>
        {/* <Link
          href="/checkout"
          className="text-sm font-semibold text-white/70 underline decoration-white/30 hover:text-white"
        >
          Go to checkout
        </Link> */}
      </div>

      <div className="mt-6 grid gap-4">
        {items.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70 backdrop-blur">
            No event selected. Choose one event and set tickets.
          </div>
        )}
        <div className="overflow-auto no-scrollbar">
          {items?.map((item) => (
            <CartItemRow key={item.event.id} item={item} />
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur">
        <p className="text-sm text-white/70">Total</p>
        <p className="text-2xl font-semibold text-white">₹{total}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
        <Link
          href="/checkout"
          className="rounded-full bg-rose-600 px-5 py-3 text-white transition hover:bg-rose-500"
        >
          Checkout
        </Link>
        {/* <Link
          href="/"
          className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-white/80 hover:bg-white/10"
        >
          Continue browsing
        </Link> */}
      </div>
    </div>
  );
}
