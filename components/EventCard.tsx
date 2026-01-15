"use client";

import { EventItem } from "../lib/types";
import { useCart } from "../lib/cart-context";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaMapMarkerAlt } from "react-icons/fa";

export function EventCard({ event }: { event: EventItem }) {
  const { addItem } = useCart();
  const router = useRouter();

  const primaryImage = event.photo || event.images?.[0] || "";

  const bg =
    primaryImage && primaryImage.startsWith("http")
      ? undefined
      : "linear-gradient(135deg,#0b1224,#121826)";

  // Google Maps search link for location
  const mapsUrl = event.location;

  const isActive = event.isActive !== false;

  return (
    <div
      className={`group flex flex-col md:flex-row overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-lg backdrop-blur transition w-full min-h-80 ${
        !isActive
          ? "opacity-60 grayscale pointer-events-none"
          : "hover:border-white/30 hover:bg-white/10"
      }`}
    >
      <div className="relative w-full md:w-80 h-56 md:h-auto shrink-0 bg-neutral-900">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={event.title}
            fill
            className="object-cover object-center"
            style={{ borderRadius: "1.5rem 0 0 1.5rem" }}
            sizes="(max-width: 768px) 100vw, 320px"
            priority
          />
        ) : (
          <div className="absolute inset-0" style={{ background: bg }} />
        )}
        <div className="absolute bottom-3 left-3 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
          ₹{event.price}
        </div>
        {/* <button
          className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 shadow"
          title="Add to cart"
          onClick={() => addItem(event, 1)}
        >
          <FaPlus />
        </button> */}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5 text-white">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
          <span>{event.type}</span>
          <span className="h-px flex-1 bg-white/15" />
          <span>{event.date}</span>
          {!isActive && (
            <span className="ml-2 rounded bg-red-600/80 px-2 py-0.5 text-xs font-bold text-white">
              Inactive
            </span>
          )}
        </div>
        <h3 className="text-2xl font-bold leading-tight mb-1">{event.title}</h3>
        {event.placename && (
          <a
            className="text-sm text-white/70 mb-1"
            href={mapsUrl}
            target="_blank"
          >
            <span className="font-semibold">
              <div
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-300 hover:underline mt-1"
                title="View on Google Maps"
              >
                <FaMapMarkerAlt className="inline-block" />
                {/* <span className="truncate max-w-45 align-middle">
                {event.location}
              </span> */}
              </div>
            </span>{" "}
            {event.placename}
          </a>
        )}
        <p className="text-base text-white/80 line-clamp-3 mb-2">
          {event.description}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-white/80 mt-auto">
          <div className="flex flex-col">
            <span className="font-semibold text-white">{event.time}</span>
            {/* <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-300 hover:underline mt-1"
              title="View on Google Maps"
            >
              <FaMapMarkerAlt className="inline-block" />
            
            </a> */}
          </div>
          {isActive && (
            <button
              onClick={() => {
                addItem(event, 1);
                router.push("/checkout");
              }}
              className="rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:border-white hover:bg-white/20"
            >
              Book now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
