"use client";

import Link from "next/link";
import { useCart } from "../lib/cart-context";
import Image from "next/image";
import ALL_STARS_LOGO from "../app/assets/allstars_studio.png";

export function Header() {
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-20 w-full border-b border-white/10 bg-black/40 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-white flex items-center gap-2"
        >
          <Image alt="AllStars" src={ALL_STARS_LOGO} width={40} height={40} />
          <span className=" text-white/80 text-xl">All Stars Studios</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-white/80">
          <Link href="/" className="hover:text-white">
            Events
          </Link>
          {/* <Link href="/cart" className="hover:text-white">
            Cart <span className="text-white/50">({cartCount})</span>
          </Link> */}
          <Link href="/profile" className="hover:text-white">
            Profile
          </Link>
        </nav>
      </div>
    </header>
  );
}
