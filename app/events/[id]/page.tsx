import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventDetailsActions } from "../../../components/EventDetailsActions";
import { fetchEventById } from "../../../lib/api";

function isVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|mov)$/i.test(url);
}

export default async function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await fetchEventById(id);
  if (!event) notFound();

  const media = event.media?.length
    ? event.media
    : event.images?.length
      ? event.images
      : event.photo
        ? [event.photo]
        : [];

  const hero = media[0] || event.photo || "";
  const venue = event.venue || event.placename || event.location;
  const category = event.category || event.type;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050506] text-white">
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
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-14 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.25em] text-white/60">
          <div className="flex items-center gap-3 text-white/70">
            <Link
              href="/"
              className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] hover:border-white/40"
            >
              Events
            </Link>
            <span className="text-white/30">/</span>
            <span>{category}</span>
          </div>
          <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-semibold">
            {event.date}
          </span>
        </div>

        <div className="mt-6 grid gap-8">
          <div className="space-y-8">
            <div
              className="overflow-hidden rounded-[32px] border border-white/20 bg-black/40 shadow-2xl backdrop-blur-md"
              style={{ boxShadow: "0 8px 32px 0 rgba(0,0,0,0.37)" }}
            >
              <div className="relative h-[260px] w-full sm:h-[340px] lg:h-[420px]">
                {hero ? (
                  isVideoUrl(hero) ? (
                    <video
                      controls
                      className="h-full w-full object-cover"
                      poster={event.photo || undefined}
                    >
                      <source src={hero} />
                    </video>
                  ) : (
                    <Image
                      src={hero}
                      alt={event.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  )
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-slate-800 via-black to-slate-900" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/70">
                    {category}
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
                    {event.title}
                  </h1>
                  <p className="mt-2 text-sm text-white/80">
                    {venue} · {event.time}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div
                className="rounded-2xl border border-white/20 bg-black/40 p-4 backdrop-blur-md"
                style={{ boxShadow: "0 4px 16px 0 rgba(0,0,0,0.37)" }}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Date
                </p>
                <p className="mt-2 text-lg font-semibold">{event.date}</p>
              </div>
              <div
                className="rounded-2xl border border-white/20 bg-black/40 p-4 backdrop-blur-md"
                style={{ boxShadow: "0 4px 16px 0 rgba(0,0,0,0.37)" }}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Time
                </p>
                <p className="mt-2 text-lg font-semibold">{event.time}</p>
              </div>
              <div
                className="rounded-2xl border border-white/20 bg-black/40 p-4 backdrop-blur-md"
                style={{ boxShadow: "0 4px 16px 0 rgba(0,0,0,0.37)" }}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Venue
                </p>
                <p className="mt-2 text-lg font-semibold">{venue}</p>
              </div>
            </div>

            <div
              className="rounded-3xl border border-white/20 bg-black/40 p-6 backdrop-blur-md"
              style={{ boxShadow: "0 4px 16px 0 rgba(0,0,0,0.37)" }}
            >
              <h2 className="text-2xl font-semibold">Event details</h2>
              <p className="mt-3 text-sm text-white/80">{event.description}</p>
            </div>

            {media.length > 1 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Gallery</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {media.slice(1).map((item, idx) => (
                    <div
                      key={`${item}-${idx}`}
                      className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30"
                    >
                      {isVideoUrl(item) ? (
                        <video
                          controls
                          className="h-full w-full object-cover"
                          poster={event.photo || undefined}
                        >
                          <source src={item} />
                        </video>
                      ) : (
                        <Image
                          src={item}
                          alt={`${event.title} media ${idx + 2}`}
                          width={960}
                          height={640}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.about?.length ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">About the event</h2>
                <div className="grid gap-4">
                  {event.about.map((section, idx) => (
                    <div
                      key={`${section.title}-${idx}`}
                      className="rounded-3xl border border-white/20 bg-black/40 p-6 backdrop-blur-md"
                      style={{ boxShadow: "0 4px 16px 0 rgba(0,0,0,0.37)" }}
                    >
                      <h3 className="text-lg font-semibold">{section.title}</h3>
                      <p className="mt-2 text-sm text-white/80">
                        {section.description}
                      </p>
                      {section.images?.length ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {section.images.map((image, imageIdx) => (
                            <Image
                              key={`${image}-${imageIdx}`}
                              src={image}
                              alt={`${section.title} image ${imageIdx + 1}`}
                              width={600}
                              height={400}
                              className="h-full w-full rounded-2xl object-cover"
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
      {/* Floating Book Now Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex w-full items-center justify-center px-4 pb-4 pointer-events-none">
        <div
          className="pointer-events-auto mx-auto flex max-w-md flex-1 items-center justify-between gap-4 rounded-2xl border border-white/20 bg-black/80 px-6 py-4 shadow-2xl backdrop-blur-md"
          style={{ boxShadow: "0 8px 32px 0 rgba(0,0,0,0.37)" }}
        >
          <span className="text-lg font-bold text-white">₹{event.price}</span>
          <EventDetailsActions
            event={event}
            buttonLabel="Book Now"
            className="!px-8 !py-3 !rounded-full !text-base !font-semibold !bg-rose-600 hover:!bg-rose-500"
          />
        </div>
      </div>
    </div>
  );
}
