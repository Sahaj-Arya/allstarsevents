"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { fetchHomeSettings, updateHomeSettings } from "../../../lib/api";

export default function AdminHomeSettingsPage() {
  const [heroVideoUrl, setHeroVideoUrl] = useState("");
  const [heroEyebrow, setHeroEyebrow] = useState("Upcoming");
  const [heroTitle, setHeroTitle] = useState("Events, Workshops & Classes");
  const [heroDescription, setHeroDescription] = useState("");
  const [heroOverlayOpacity, setHeroOverlayOpacity] = useState("70");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
            Update hero background video, text, and overlay UI for the home
            events screen.
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
                className="min-h-[80px] w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
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
