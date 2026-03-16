"use client";

import { useState, useEffect } from "react";
import { EventCard } from "../../components/EventCard";
import { fetchEvents, fetchHomeSettings } from "../../lib/api";
import { EventItem, HomeSettings } from "../../lib/types";

type SortBy = "date-asc" | "date-desc" | "price-asc" | "price-desc" | "title";
type FilterBy = "all" | "event" | "workshop" | "class";

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventItem[]>([]);
  const [filterBy, setFilterBy] = useState<FilterBy>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date-desc");
  const [loading, setLoading] = useState(true);
  const [homeSettings, setHomeSettings] = useState<HomeSettings>({
    heroVideoUrl:
      "https://api.prod.allstarsstudio.in/uploads/1772568700049-Video_Editing_Brighter_Colors.webm",
    heroEyebrow: "Upcoming",
    heroTitle: "Events, Workshops & Classes",
    heroDescription: "",
    heroOverlayOpacity: 70,
  });

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await fetchEvents();
        setEvents(data || []);
      } catch (error) {
        console.error("Error loading events:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  useEffect(() => {
    const loadHomeSettings = async () => {
      const settings = await fetchHomeSettings();
      if (settings) {
        setHomeSettings((prev) => ({ ...prev, ...settings }));
      }
    };
    loadHomeSettings();
  }, []);

  useEffect(() => {
    let result = [...events];

    // Apply filter
    if (filterBy !== "all") {
      result = result.filter((event) => event.type === filterBy);
    }

    // Apply sort
    switch (sortBy) {
      case "date-asc":
        result.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateA - dateB;
        });
        break;
      case "date-desc":
        result.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        });
        break;
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    setFilteredEvents(result);
  }, [events, filterBy, sortBy]);

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
          <source src={homeSettings.heroVideoUrl} type="video/webm" />
        </video>
        <div
          className="absolute inset-0 bg-black"
          style={{
            opacity:
              Math.max(0, Math.min(100, homeSettings.heroOverlayOpacity)) / 100,
          }}
        />
      </div>
      <section className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
        {/* Header with Title and Controls */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/60">
              {homeSettings.heroEyebrow || "Upcoming"}
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold">
              {homeSettings.heroTitle || "Events, Workshops & Classes"}
            </h1>
            {homeSettings.heroDescription?.trim() && (
              <p className="mt-2 max-w-2xl text-sm text-white/70">
                {homeSettings.heroDescription}
              </p>
            )}
          </div>

          {/* Filter and Sort Controls - Right Aligned */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {/* Filter */}
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest text-white/60">
                Filter By
              </label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as FilterBy)}
                className="rounded-lg border border-white/20 bg-white/10 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 transition"
              >
                <option value="all">All Types</option>
                <option value="event">Events</option>
                <option value="workshop">Workshops</option>
                <option value="class">Classes</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest text-white/60">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="rounded-lg border border-white/20 bg-white/10 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 transition"
              >
                <option value="date-desc">Date (Latest)</option>
                <option value="date-asc">Date (Earliest)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        {/* <div className="mb-8 text-xs sm:text-sm text-white/60">
          {filteredEvents.length} result
          {filteredEvents.length !== 1 ? "s" : ""}
        </div> */}

        {/* Events Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-white/60">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-white/60">
              No events found matching your filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
