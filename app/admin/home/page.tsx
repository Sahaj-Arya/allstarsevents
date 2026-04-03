"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Lottie from "react-lottie-player";
import ALL_STARS_LOGO from "../../../public/assets/allstars_studio.png";
import { fetchHomeSettings, updateHomeSettings } from "../../../lib/api";

async function loadDefaultAnimation() {
  const response = await fetch("/assets/bottle.json");
  return (await response.json()) as Record<string, unknown>;
}

export default function AdminHomeSettingsPage() {
  const [heroVideoUrl, setHeroVideoUrl] = useState("");
  const [heroEyebrow, setHeroEyebrow] = useState("Upcoming");
  const [heroTitle, setHeroTitle] = useState("Events, Workshops & Classes");
  const [heroDescription, setHeroDescription] = useState("");
  const [heroOverlayOpacity, setHeroOverlayOpacity] = useState("70");
  const [loaderText, setLoaderText] = useState("AllStars Studios");
  const [loaderAnimationData, setLoaderAnimationData] = useState<Record<string, unknown> | null>(null);
  const [defaultLoaderAnimationData, setDefaultLoaderAnimationData] = useState<Record<string, unknown> | null>(null);
  const [loaderAnimationFileName, setLoaderAnimationFileName] = useState("");
  const [showLoaderLottie, setShowLoaderLottie] = useState(true);
  const [showLoaderLogo, setShowLoaderLogo] = useState(true);
  const [showLoaderText, setShowLoaderText] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewAnimationData = loaderAnimationData || defaultLoaderAnimationData;

  useEffect(() => {
    void loadDefaultAnimation()
      .then((data) => setDefaultLoaderAnimationData(data))
      .catch(() => setDefaultLoaderAnimationData(null));

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const settings = await fetchHomeSettings();
        if (!settings) return;
        setHeroVideoUrl(settings.heroVideoUrl || "");
        setHeroEyebrow(settings.heroEyebrow || "Upcoming");
        setHeroTitle(settings.heroTitle || "Events, Workshops & Classes");
        setHeroDescription(settings.heroDescription || "");
        setHeroOverlayOpacity(String(settings.heroOverlayOpacity ?? 70));
        setLoaderText(settings.loaderText || "AllStars Studios");
        setLoaderAnimationData(settings.loaderAnimationData || null);
        setLoaderAnimationFileName(
          settings.loaderAnimationData ? "Custom loader animation saved" : "",
        );
        setShowLoaderLottie(settings.showLoaderLottie ?? true);
        setShowLoaderLogo(settings.showLoaderLogo ?? true);
        setShowLoaderText(settings.showLoaderText ?? true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load settings",
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLoaderFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Record<string, unknown>;
      setLoaderAnimationData(parsed);
      setLoaderAnimationFileName(file.name);
    } catch {
      setError("Invalid Lottie JSON file");
      event.target.value = "";
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateHomeSettings({
        heroVideoUrl,
        heroEyebrow,
        heroTitle,
        heroDescription,
        heroOverlayOpacity: Number(heroOverlayOpacity),
        loaderText,
        loaderAnimationData,
        showLoaderLottie,
        showLoaderLogo,
        showLoaderText,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">Home settings</h1>
          <p className="mt-2 text-sm text-white/70">
            Update home hero content and the global loading screen. Loader
            changes apply without redeploying.
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 hover:border-white/40"
        >
          Back to admin
        </Link>
      </div>

      <form
        onSubmit={handleSave}
        className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur"
      >
        {loading ? (
          <p className="text-sm text-white/70">Loading settings...</p>
        ) : (
          <>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-white">
                Background video URL
              </span>
              <input
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                value={heroVideoUrl}
                onChange={(e) => setHeroVideoUrl(e.target.value)}
                placeholder="https://...webm or ...mp4"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-white">Eyebrow</span>
              <input
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                value={heroEyebrow}
                onChange={(e) => setHeroEyebrow(e.target.value)}
                placeholder="Upcoming"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-white">Title</span>
              <input
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="Events, Workshops & Classes"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-white">
                Description
              </span>
              <textarea
                className="min-h-20 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                value={heroDescription}
                onChange={(e) => setHeroDescription(e.target.value)}
                placeholder="Optional supporting text"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-white">
                Overlay opacity (0-100)
              </span>
              <input
                type="number"
                min={0}
                max={100}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                value={heroOverlayOpacity}
                onChange={(e) => setHeroOverlayOpacity(e.target.value)}
              />
            </label>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <h2 className="text-base font-semibold text-white">
                Global loader
              </h2>
              <p className="mt-1 text-sm text-white/60">
                Upload a Lottie JSON animation and edit the loader text shown
                with the AllStars icon at the bottom.
              </p>

              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white">
                    <input
                      type="checkbox"
                      checked={showLoaderLottie}
                      onChange={(e) => setShowLoaderLottie(e.target.checked)}
                      className="h-4 w-4 accent-rose-500"
                    />
                    <span>Show lottie</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white">
                    <input
                      type="checkbox"
                      checked={showLoaderLogo}
                      onChange={(e) => setShowLoaderLogo(e.target.checked)}
                      className="h-4 w-4 accent-rose-500"
                    />
                    <span>Show logo</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white">
                    <input
                      type="checkbox"
                      checked={showLoaderText}
                      onChange={(e) => setShowLoaderText(e.target.checked)}
                      className="h-4 w-4 accent-rose-500"
                    />
                    <span>Show text</span>
                  </label>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-white">
                    Loader text
                  </span>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                    value={loaderText}
                    onChange={(e) => setLoaderText(e.target.value)}
                    placeholder="AllStars Studios"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-white">
                    Lottie JSON file
                  </span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="block w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                    onChange={handleLoaderFileChange}
                  />
                </label>

                <div className="flex flex-wrap items-center gap-3 text-sm text-white/65">
                  <span>
                    {loaderAnimationFileName ||
                      (loaderAnimationData
                        ? "Custom loader animation ready"
                        : "Using default bottle animation")}
                  </span>
                  {loaderAnimationData ? (
                    <button
                      type="button"
                      onClick={() => {
                        setLoaderAnimationData(null);
                        setLoaderAnimationFileName("");
                      }}
                      className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white/80 hover:border-white/40"
                    >
                      Use default animation
                    </button>
                  ) : null}
                </div>

                {(showLoaderLottie && previewAnimationData) || showLoaderLogo || showLoaderText ? (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                      Loader preview
                    </p>
                    <div className="mt-3 flex flex-col items-center gap-4">
                      {showLoaderLottie && previewAnimationData ? (
                        <Lottie
                          animationData={previewAnimationData}
                          play
                          loop
                          speed={1}
                          style={{ width: 140, height: 140, background: "transparent" }}
                        />
                      ) : null}
                      {showLoaderLogo ? (
                        <Image alt="AllStars" src={ALL_STARS_LOGO} width={40} height={40} />
                      ) : null}
                      {showLoaderText ? (
                        <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-white/85">
                          {loaderText || "AllStars Studios"} ...
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save home settings"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
