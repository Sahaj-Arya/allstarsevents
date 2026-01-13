import Link from "next/link";
import { EventCard } from "../components/EventCard";
import { fetchEvents } from "../lib/api";

export default async function Home() {
  const events = await fetchEvents();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-neutral-900 text-white">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/60">
              Upcoming
            </p>
            <h1 className="text-3xl font-semibold">Events & Classes</h1>
          </div>
          <div className="flex gap-3 text-sm font-semibold text-white/80">
            <Link
              href="/cart"
              className="rounded-full border border-white/20 px-4 py-2 hover:bg-white/10"
            >
              Cart
            </Link>
            <Link
              href="/checkout"
              className="rounded-full bg-white text-black px-4 py-2 hover:bg-white/90"
            >
              Checkout
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>
    </div>
  );
}
