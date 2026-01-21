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
  const bgImage = (() => {
    if (!isVideoUrl(hero)) return null;
    const second = media[1] || event.photo || "";
    return second && !isVideoUrl(second) ? second : null;
  })();
  const venue = event.venue || event.placename || event.location;
  const category = event.category || event.type;
  const originalPrice = event.original_price;
  const hasDiscount =
    typeof originalPrice === "number" && originalPrice > event.price;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050506] text-white">
      <div className="pointer-events-none absolute inset-0 z-0">
        {bgImage ? (
          <Image
            src={bgImage}
            alt={event.title || "background"}
            fill
            className="h-full w-full object-cover"
            priority={false}
          />
        ) : (
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
        )}
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <div className="relative z-10 w-full py-8">
        <div className="mx-auto w-full max-w-6xl px-5">
          <div className="mx-auto max-w-6xl px-5 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.25em] text-white/60">
              <div className="flex items-center gap-3 text-white/70">
                <Link
                  href="/"
                  className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] hover:border-white/40"
                >
                  Events
                </Link>
                <span className="text-white/30">/</span>
                <span>{event.title}</span>
              </div>
              {/* <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-semibold">
                {event.date}
              </span> */}
            </div>
          </div>
          <div className="overflow-hidden rounded-[12] border border-white/10 bg-black/10 backdrop-blur-xs shadow-2xl p-2">
            {hero ? (
              isVideoUrl(hero) ? (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full object-cover rounded-[10px] h-[220]"
                  poster={event.photo || undefined}
                  preload="auto"
                  aria-hidden="true"
                  tabIndex={-1}
                >
                  <source src={hero} />
                </video>
              ) : (
                <Image
                  src={hero}
                  alt={event.title}
                  fill
                  className="object-cover rounded-[12]"
                  priority
                />
              )
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-slate-800 via-black to-slate-900" />
            )}
            <div className="mt-4">
              {/* <div className="rounded-3xl border border-white/20 bg-black/40 p-6 backdrop-blur-md shadow-2xl"> */}
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                {category}
              </p>
              <h1 className="mt-1 text-xl font-semibold sm:text-4xl">
                {event.title}
              </h1>
              {/* </div> */}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div
                className="rounded-2xl "
                style={{ boxShadow: "0 4px 16px 0 rgba(0,0,0,0)" }}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-white/50 pt-5">
                  ON
                </p>
                <p className="mt-2 text-lg font-semibold">{event.date}</p>
              </div>
              <div
                className="rounded-2xl pt-6"
                style={{ boxShadow: "0 4px 16px 0 rgba(0,0,0,0)" }}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Around
                </p>
                <p className="mt-2 text-lg font-semibold">{event.time}</p>
              </div>
              <div
                className="rounded-2xl pt-6"
                style={{ boxShadow: "0 4px 16px 0 rgba(0,0,0,0)" }}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                  AT
                </p>
                <Link
                  href={event?.location}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <p className="mt-2 text-lg font-semibold">{venue}</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-14 pt-0">
        <div className="mt-0 grid gap-8">
          <div className="space-y-8">
            <div
              className="rounded-3xl border border-white/20 bg-black/40 p-6 backdrop-blur-md"
              style={{ boxShadow: "0 4px 16px 0 rgba(0,0,0,0.37)" }}
            >
              <h2 className="text-2xl font-semibold">Show Description</h2>
              <p className="mt-3 text-sm text-white/80">{event.description}</p>
            </div>

            {media.length > 2 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Gallery</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {media.slice(2).map((item, idx) => (
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
          className="pointer-events-auto mx-auto flex max-w-md flex-1 flex-nowrap items-center justify-between gap-4 rounded-2xl border border-white/20 bg-black/80 px-6 py-4 shadow-2xl backdrop-blur-md"
          style={{ boxShadow: "0 8px 32px 0 rgba(0,0,0,0.37)" }}
        >
          <div className="flex flex-col items-center gap-0 text-white">
            {hasDiscount && (
              <span className="text-white/60 line-through text-sm">
                ₹{originalPrice}
              </span>
            )}
            <span className="text-lg mt-[-4] font-bold">₹{event.price}</span>
          </div>
          <EventDetailsActions
            event={event}
            buttonLabel="Book Now"
            className="!px-8 !py-3 !rounded-full !text-base !font-semibold !bg-rose-600 hover:!bg-rose-500"
            hideQuantity
          />
        </div>
      </div>
    </div>
  );
}
