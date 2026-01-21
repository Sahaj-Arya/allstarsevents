import Link from "next/link";
import { EventCard } from "../../components/EventCard";
import { fetchEvents } from "../../lib/api";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await fetchEvents();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-slate-900 to-neutral-900 text-white">
      <div className="pointer-events-none absolute inset-0 z-0">
        <video
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          <source src="/assets/IMG_0311.MP4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/70" />
      </div>
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/60">
              Upcoming
            </p>
            <h1 className="text-3xl font-semibold md:text-xl">
              Events & Classes
            </h1>
          </div>
          <div className="flex gap-3 text-sm font-semibold text-white/80"></div>
        </div>

        <div className="grid gap-4">
          {events?.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>
    </div>
  );
}
