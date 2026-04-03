import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClassSessionSelector } from "../../../components/ClassSessionSelector";
import { EventDetailsActions } from "../../../components/EventDetailsActions";
import { fetchEventById } from "../../../lib/api";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.allstarsstudio.in";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.prod.allstarsstudio.in";

function resolveShareAssetUrl(url?: string | null) {
  if (!url) return null;

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const base = url.startsWith("/uploads/") ? API_BASE_URL : SITE_URL;
  return new URL(url, `${base.replace(/\/$/, "")}/`).toString();
}

function getShareImage(event: Awaited<ReturnType<typeof fetchEventById>>) {
  if (!event) return null;

  const candidates = [
    event.photo,
    ...(event.images || []),
    ...(event.media || []),
  ].filter(Boolean);

  const firstImage = candidates.find((item) => !isVideoUrl(item));
  return resolveShareAssetUrl(firstImage || null);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await fetchEventById(id);

  if (!event) {
    return {
      title: `Event ${id} | AllStars`,
      description: "Book your ticket now",
    };
  }

  const imageUrl = getShareImage(event);
  const pageUrl = new URL(
    `/events/${id}`,
    `${SITE_URL.replace(/\/$/, "")}/`,
  ).toString();
  const title = `${event.title || `Event ${id}`} | AllStars`;
  const description = event.description || "Book your ticket now";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: event.title || `Event ${id}`,
            },
          ]
        : [],
    },
  };
}

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

  const media = event.images?.length
    ? event.images
    : event.media?.length
      ? event.media
      : event.photo
        ? [event.photo]
        : [];

  const hero = media[0] || event.photo || "";
  const heroIsVideo = Boolean(hero) && isVideoUrl(hero);
  const bgImage = (() => {
    if (!heroIsVideo) return hero || null;
    const secondImage = media.slice(1).find((item) => !isVideoUrl(item));
    if (secondImage) return secondImage;
    return event.photo && !isVideoUrl(event.photo) ? event.photo : null;
  })();
  const venue = event.venue || event.placename || event.location;
  const category = event.category || event.type;
  const originalPrice = event.original_price;
  const hasDiscount =
    typeof originalPrice === "number" && originalPrice > event.price;
  const isRecurringClass =
    event.type === "class" &&
    event.repeat?.enabled &&
    event.repeat?.frequency === "weekly" &&
    Boolean(event.repeat?.daysOfWeek?.length);

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

      <div className="relative z-10 w-full py-2 sm:py-3">
        <div className="w-full px-2 sm:px-3 lg:px-4">
          <div className="w-full px-1 pb-3 sm:px-1 sm:pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-[0.22em] text-white/55 sm:text-xs">
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
          <div className="overflow-hidden rounded-[18px] border border-white/10 bg-black/20 p-2 shadow-2xl backdrop-blur-xs">
            <div className="relative h-[58svh] min-h-[360px] w-full overflow-hidden rounded-[14px] bg-black/40 sm:h-[68svh] sm:min-h-[460px] lg:h-[78svh] lg:min-h-[620px]">
              {hero ? (
                heroIsVideo ? (
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="h-full w-full object-cover"
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
                    className="object-contain"
                    priority
                  />
                )
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-slate-800 via-black to-slate-900" />
              )}
            </div>
            <div className="mt-3 px-1 pb-1 sm:mt-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/60 sm:text-xs">
                {category}
              </p>
              <h1 className="mt-1 text-lg font-semibold leading-tight sm:text-2xl lg:text-3xl">
                {event.title}
              </h1>
            </div>
            <div className="grid gap-2 px-1 pb-2 sm:grid-cols-3 sm:gap-3">
              <div
                className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3"
                style={{ boxShadow: "0 4px 16px 0 rgba(0,0,0,0)" }}
              >
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                  ON
                </p>
                <p className="mt-1 text-sm font-medium sm:text-base">{event.date}</p>
              </div>
              <div
                className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3"
                style={{ boxShadow: "0 4px 16px 0 rgba(0,0,0,0)" }}
              >
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                  Around
                </p>
                <p className="mt-1 text-sm font-medium sm:text-base">{event.time}</p>
              </div>
              <div
                className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3"
                style={{ boxShadow: "0 4px 16px 0 rgba(0,0,0,0)" }}
              >
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                  AT
                </p>
                <Link
                  href={event?.location}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <p className="mt-1 text-sm font-medium sm:text-base">{venue}</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="relative z-10 w-full px-2 pb-14 pt-1 sm:px-3 lg:px-4">
        <div className="mt-0 grid w-full gap-5">
          <div className="space-y-5">
            {isRecurringClass && <ClassSessionSelector event={event} />}
            <div
              className="rounded-3xl border border-white/15 bg-black/35 p-4 backdrop-blur-md sm:p-5"
              style={{ boxShadow: "0 4px 16px 0 rgba(0,0,0,0.37)" }}
            >
              <h2 className="text-base font-semibold sm:text-lg">Show Description</h2>
              <p className="mt-2 text-xs leading-6 text-white/78 sm:text-sm">{event.description}</p>
            </div>

            {media.length > 2 && (
              <div className="space-y-3">
                <h3 className="text-base font-semibold sm:text-lg">Gallery</h3>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {media.slice(2).map((item, idx) => (
                    <div
                      key={`${item}-${idx}`}
                      className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 min-h-[260px] sm:min-h-[340px] lg:min-h-[420px]"
                    >
                      {isVideoUrl(item) ? (
                        <video
                          controls
                          className="h-full w-full object-contain"
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
                          className="h-full w-full object-contain"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.about?.length ? (
              <div className="space-y-4">
                <h2 className="text-base font-semibold sm:text-lg">About the event</h2>
                <div className="grid gap-4 xl:grid-cols-2">
                  {event.about.map((section, idx) => (
                    <div
                      key={`${section.title}-${idx}`}
                      className="rounded-3xl border border-white/15 bg-black/35 p-4 backdrop-blur-md sm:p-5"
                      style={{ boxShadow: "0 4px 16px 0 rgba(0,0,0,0.37)" }}
                    >
                      <h3 className="text-sm font-semibold sm:text-base">{section.title}</h3>
                      <p className="mt-2 text-xs leading-6 text-white/78 sm:text-sm">
                        {section.description}
                      </p>
                      {section.images?.length ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {section.images.map((image, imageIdx) => (
                            <div
                              key={`${image}-${imageIdx}`}
                              className="overflow-hidden rounded-2xl bg-black/30 min-h-[260px] sm:min-h-[340px]"
                            >
                              <Image
                                src={image}
                                alt={`${section.title} image ${imageIdx + 1}`}
                                width={600}
                                height={400}
                                className="h-full w-full rounded-2xl object-contain bg-black/30"
                              />
                            </div>
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
      {!isRecurringClass && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex w-full items-center justify-center px-4 pb-4 pointer-events-none">
          <div
              className="pointer-events-auto mx-auto flex max-w-md flex-1 flex-nowrap items-center justify-between gap-4 rounded-2xl border border-white/20 bg-black/20 px-3 py-3 shadow-2xl backdrop-blur-md"
            style={{ boxShadow: "0 8px 32px 0 rgba(0,0,0,0.37)" }}
          >
            <div className="flex flex-col items-center gap-0 text-white">
              {hasDiscount && (
                <span className="text-white/60 line-through text-sm">
                  ₹{originalPrice}
                </span>
              )}
                <span className="mt-[-2] text-base font-bold sm:text-lg">₹{event.price}</span>
            </div>
            <EventDetailsActions
              event={event}
              buttonLabel="Book Now"
              className="!px-6 !py-2 !rounded-full !text-base !font-semibold !bg-rose-600 hover:!bg-rose-500"
              hideQuantity
            />
          </div>
        </div>
      )}
    </div>
  );
}
