"use client";

import Link from "next/link";
import { CartItemRow } from "../../components/CartItemRow";
import { useCart } from "../../lib/cart-context";

export default function CartPage() {
  const { items, total } = useCart();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-neutral-900">
          Your selection
        </h1>
        <Link
          href="/checkout"
          className="text-sm font-semibold text-neutral-700 underline"
        >
          Go to checkout
        </Link>
      </div>

      <div className="mt-6 grid gap-4">
        {items.length === 0 && (
          <div className="rounded-2xl border border-black/5 bg-white p-6 text-neutral-700">
            No event selected. Choose one event and set tickets.
          </div>
        )}

        {items.map((item) => (
          <CartItemRow key={item.event.id} item={item} />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <p className="text-sm text-neutral-700">Total</p>
        <p className="text-2xl font-semibold text-neutral-900">₹{total}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
        <Link
          href="/checkout"
          className="rounded-full bg-black px-5 py-3 text-white transition hover:bg-neutral-800"
        >
          Checkout
        </Link>
        <Link
          href="/"
          className="rounded-full border border-black/10 px-5 py-3 text-neutral-900"
        >
          Continue browsing
        </Link>
      </div>
    </div>
  );
}
