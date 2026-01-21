"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { createEvent, updateEvent, uploadImage } from "../../../lib/api";
import { EventItem } from "../../../lib/types";

const toList = (value: string) =>
  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

export default function AdminEventsPage() {
  const [mode, setMode] = useState<"create" | "update">("create");
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [photo, setPhoto] = useState("");
  const [images, setImages] = useState("");
  const [media, setMedia] = useState("");
  const [placename, setPlacename] = useState("");
  const [venue, setVenue] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<EventItem["type"]>("event");
  const [isActive, setIsActive] = useState(true);
  const [aboutJson, setAboutJson] = useState("[]");
  const [result, setResult] = useState<EventItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<
    Array<{ url: string; mime: string }>
  >([]);

  const parsedAbout = useMemo(() => {
    if (!aboutJson.trim()) return { value: [], error: null };
    try {
      const parsed = JSON.parse(aboutJson);
      return { value: parsed, error: null };
    } catch (err) {
      return { value: [], error: "Invalid JSON" };
    }
  }, [aboutJson]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (parsedAbout.error) {
        throw new Error("About JSON is invalid");
      }
      const payload = {
        id,
        title,
        description,
        price: Number(price),
        original_price:
          originalPrice.trim().length > 0 ? Number(originalPrice) : undefined,
        photo,
        images: toList(images),
        media: toList(media),
        placename,
        venue,
        category,
        date,
        time,
        location,
        type,
        isActive,
        about: parsedAbout.value,
      };

      const event =
        mode === "create"
          ? await createEvent(payload)
          : await updateEvent(id, payload);
      setResult(event);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;
    setUploading(true);
    setUploadError(null);
    const next: Array<{ url: string; mime: string }> = [];
    for (const file of uploadFiles) {
      try {
        const res = await uploadImage(file);
        next.push({ url: res.url, mime: res.mime });
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed");
      }
    }
    if (next.length > 0) {
      setUploadedMedia((prev) => [...next, ...prev]);
    }
    setUploading(false);
  };

  const appendText = (prev: string, value: string) =>
    prev.trim().length === 0 ? value : `${prev}\n${value}`;

  const handleCopy = async (value: string) => {
    if (typeof navigator === "undefined") return;
    await navigator.clipboard.writeText(value);
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Manage events</h1>
          <p className="mt-2 text-sm text-white/70">
            Create or update event details. Upload images or videos below.
          </p>
        </div>
        <Link
          href="/admin/upload"
          className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 hover:border-white/40"
        >
          Open uploader
        </Link>
      </div>

      <div className="mt-6 flex items-center gap-3 text-sm text-white/70">
        <button
          type="button"
          onClick={() => setMode("create")}
          className={`rounded-full px-4 py-2 font-semibold ${
            mode === "create"
              ? "bg-rose-600 text-white"
              : "border border-white/15"
          }`}
        >
          Create
        </button>
        <button
          type="button"
          onClick={() => setMode("update")}
          className={`rounded-full px-4 py-2 font-semibold ${
            mode === "update"
              ? "bg-rose-600 text-white"
              : "border border-white/15"
          }`}
        >
          Update
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur"
      >
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Upload media</p>
              <p className="text-xs text-white/60">
                Upload images or videos and insert URLs directly into fields.
              </p>
            </div>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || uploadFiles.length === 0}
              className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload selected"}
            </button>
          </div>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            className="mt-4 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-white/20"
            onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
          />

          {uploadError && (
            <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
              {uploadError}
            </div>
          )}

          {uploadedMedia.length > 0 && (
            <div className="mt-4 space-y-3 text-xs text-white/70">
              {uploadedMedia.map((item) => (
                <div
                  key={item.url}
                  className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/40 p-3"
                >
                  <span className="break-all">{item.url}</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.url)}
                      className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 hover:border-white/40"
                    >
                      Copy URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhoto(item.url)}
                      className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 hover:border-white/40"
                    >
                      Use as cover
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setMedia((prev) => appendText(prev, item.url))
                      }
                      className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 hover:border-white/40"
                    >
                      Add to media
                    </button>
                    {item.mime.startsWith("image/") && (
                      <button
                        type="button"
                        onClick={() =>
                          setImages((prev) => appendText(prev, item.url))
                        }
                        className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 hover:border-white/40"
                      >
                        Add to images
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-white">Event ID</span>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="evt-delhi-night"
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-white">Title</span>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Karan Aujla Live"
              required
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-white">Description</span>
          <textarea
            className="min-h-[90px] w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <div className="grid gap-4 md:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-white">Price</span>
            <input
              type="number"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-white">
              Original price
            </span>
            <input
              type="number"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              placeholder="e.g. 1999"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-white">Date</span>
            <input
              type="date"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-white">Time</span>
            <input
              type="time"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-white">Location</span>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-white">Place name</span>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              value={placename}
              onChange={(e) => setPlacename(e.target.value)}
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-white">Venue</span>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-white">Category</span>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-white">Photo URL</span>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-white">Type</span>
            <select
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              value={type}
              onChange={(e) => setType(e.target.value as EventItem["type"])}
            >
              <option value="event">Event</option>
              <option value="class">Class</option>
            </select>
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Active
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-white">
            Images (URLs)
          </span>
          <textarea
            className="min-h-[70px] w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            value={images}
            onChange={(e) => setImages(e.target.value)}
            placeholder="One URL per line"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-white">
            Media (image/video URLs)
          </span>
          <textarea
            className="min-h-[70px] w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            value={media}
            onChange={(e) => setMedia(e.target.value)}
            placeholder="One URL per line"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-white">
            About sections (JSON array)
          </span>
          <textarea
            className="min-h-[120px] w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            value={aboutJson}
            onChange={(e) => setAboutJson(e.target.value)}
            placeholder='[{"title":"Lineup","description":"...","images":["url"]}]'
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Saving..."
            : mode === "create"
              ? "Create event"
              : "Update event"}
        </button>

        {(error || parsedAbout.error) && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {error || parsedAbout.error}
          </div>
        )}

        {result && (
          <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/70">
            Saved: {result.title} ({result.id})
          </div>
        )}
      </form>
    </div>
  );
}
