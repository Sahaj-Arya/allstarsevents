"use client";

import Link from "next/link";
import { useCart } from "../lib/cart-context";

export function Header() {
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-20 w-full border-b border-black/5 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          All Stars Dance
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-neutral-700">
          <Link href="/" className="hover:text-black">
            Events
          </Link>
          <Link href="/cart" className="hover:text-black">
            Cart ({cartCount})
          </Link>
          <Link href="/profile" className="hover:text-black">
            Profile
          </Link>
        </nav>
      </div>
    </header>
  );
}
