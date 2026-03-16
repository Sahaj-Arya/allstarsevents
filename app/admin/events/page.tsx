"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  createEvent,
  deleteEvent,
  fetchEvents,
  updateEvent,
  uploadImage,
} from "../../../lib/api";
import { EventItem } from "../../../lib/types";

const toList = (value: string) =>
  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const pad2 = (value: number) => String(value).padStart(2, "0");

const toDateInputValue = (raw?: string) => {
  if (!raw) return "";
  const value = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const ymd = value.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (ymd) {
    const [, year, month, day] = ymd;
    return `${year}-${pad2(Number(month))}-${pad2(Number(day))}`;
  }

  const dmy = value.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (dmy) {
    const [, day, month, year] = dmy;
    return `${year}-${pad2(Number(month))}-${pad2(Number(day))}`;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
  }

  return "";
};

const toTimeInputValue = (raw?: string) => {
  if (!raw) return "";
  const value = raw.trim();
  if (/^\d{2}:\d{2}$/.test(value)) return value;

  const hhmmss = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (hhmmss) {
    const [, hour, minute] = hhmmss;
    return `${pad2(Number(hour))}:${minute}`;
  }

  const amPm = value.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (amPm) {
    const [, hourRaw, minute, meridian] = amPm;
    let hour = Number(hourRaw) % 12;
    if (meridian.toLowerCase() === "pm") hour += 12;
    return `${pad2(hour)}:${minute}`;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return `${pad2(parsed.getHours())}:${pad2(parsed.getMinutes())}`;
  }

  return "";
};

const toDateTimeLocalValue = (dateRaw?: string, timeRaw?: string) => {
  const dateValue = toDateInputValue(dateRaw);
  const timeValue = toTimeInputValue(timeRaw);
  if (dateValue && timeValue) return `${dateValue}T${timeValue}`;
  if (dateValue) return `${dateValue}T00:00`;
  return "";
};

const splitDateTimeLocalValue = (value: string) => {
  if (!value) return { date: "", time: "" };
  const [datePart, timePart = "00:00"] = value.split("T");
  return {
    date: toDateInputValue(datePart) || datePart,
    time: toTimeInputValue(timePart) || timePart,
  };
};

const getEventLifecycleStatus = (event: EventItem) => {
  if (event.lifecycleStatus) return event.lifecycleStatus;
  const date = toDateInputValue(event.date);
  const time = toTimeInputValue(event.time) || "00:00";
  if (date) {
    const parsed = Date.parse(`${date}T${time}`);
    if (!Number.isNaN(parsed) && parsed < Date.now()) return "past" as const;
  }
  if (event.isActive === false) return "inactive" as const;
  return "active" as const;
};

const generateClassDates = (
  startDate: string,
  daysOfWeek: number[],
  until?: string,
  occurrences?: number,
) => {
  if (!startDate || daysOfWeek.length === 0) return [];

  const dates: string[] = [];
  const start = new Date(startDate);
  const endDate = until
    ? new Date(until)
    : new Date(start.getFullYear(), start.getMonth() + 1, 0);

  const currentDate = new Date(start);
  let count = 0;
  const maxOccurrences =
    typeof occurrences === "number" ? occurrences : Infinity;

  while (currentDate <= endDate && count < maxOccurrences) {
    const dayOfWeek = currentDate.getDay();
    if (daysOfWeek.includes(dayOfWeek)) {
      dates.push(currentDate.toISOString().split("T")[0]);
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

const lifecycleRank = (status: "active" | "inactive" | "past") => {
  if (status === "active") return 0;
  if (status === "inactive") return 1;
  return 2;
};

const toEventTimeValue = (event: EventItem) => {
  const date = toDateInputValue(event.date);
  const time = toTimeInputValue(event.time) || "00:00";
  if (!date) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(`${date}T${time}`);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
};

export default function AdminEventsPage() {
  const [mode, setMode] = useState<"create" | "update">("create");
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [photo, setPhoto] = useState("");
  const [dropInPrice, setDropInPrice] = useState("");
  const [images, setImages] = useState("");
  const [media, setMedia] = useState("");
  const [placename, setPlacename] = useState("");
  const [venue, setVenue] = useState("");
  const [category, setCategory] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<EventItem["type"]>("event");
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState<
    "daily" | "weekly" | "monthly"
  >("weekly");
  const [repeatInterval, setRepeatInterval] = useState("1");
  const [repeatUntil, setRepeatUntil] = useState("");
  const [repeatOccurrences, setRepeatOccurrences] = useState("");
  const [repeatDaysOfWeek, setRepeatDaysOfWeek] = useState<number[]>([1, 3, 5]); // Default: Mon, Wed, Fri
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
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const applyEventToForm = (event: EventItem) => {
    setMode("update");
    setId(event.id || "");
    setTitle(event.title || "");
    setDescription(event.description || "");
    setPrice(String(event.price ?? ""));
    setOriginalPrice(
      typeof event.original_price === "number"
        ? String(event.original_price)
        : "",
    );
    setPhoto(event.photo || "");
    setDropInPrice(
      typeof event.drop_in_price === "number"
        ? String(event.drop_in_price)
        : "",
    );
    setImages((event.images || []).join("\n"));
    setMedia((event.media || []).join("\n"));
    setPlacename(event.placename || "");
    setVenue(event.venue || "");
    setCategory(event.category || "");
    setDateTime(toDateTimeLocalValue(event.date, event.time));
    setLocation(event.location || "");
    setType(event.type || "event");
    setIsActive(event.isActive !== false);
    setAboutJson(JSON.stringify(event.about || [], null, 2));

    const repeat = event.repeat;
    const shouldEnableRepeat =
      event.type === "class" &&
      Boolean(repeat?.enabled) &&
      repeat?.frequency !== "none";
    setRepeatEnabled(shouldEnableRepeat);
    setRepeatFrequency(
      repeat?.frequency === "daily" ||
        repeat?.frequency === "weekly" ||
        repeat?.frequency === "monthly"
        ? repeat.frequency
        : "weekly",
    );
    setRepeatInterval(String(Math.max(1, Number(repeat?.interval) || 1)));
    setRepeatUntil(toDateInputValue(repeat?.until || ""));
    setRepeatOccurrences(
      typeof repeat?.occurrences === "number" ? String(repeat.occurrences) : "",
    );
    setRepeatDaysOfWeek(
      repeat?.daysOfWeek && repeat.daysOfWeek.length > 0
        ? repeat.daysOfWeek
        : [1, 3, 5],
    );
  };

  const loadEvents = async () => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const data = await fetchEvents();
      setEvents(data || []);
    } catch (err) {
      setEventsError(
        err instanceof Error ? err.message : "Failed to load events",
      );
    } finally {
      setEventsLoading(false);
    }
  };

  const parsedAbout = useMemo(() => {
    if (!aboutJson.trim()) return { value: [], error: null };
    try {
      const parsed = JSON.parse(aboutJson);
      return { value: parsed, error: null };
    } catch {
      return { value: [], error: "Invalid JSON" };
    }
  }, [aboutJson]);

  useEffect(() => {
    if (type !== "class") {
      setRepeatEnabled(false);
      setRepeatFrequency("weekly");
      setRepeatInterval("1");
      setRepeatUntil("");
      setRepeatOccurrences("");
    }
  }, [type]);

  useEffect(() => {
    loadEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = events.filter(
      (event) =>
        event.title?.toLowerCase().includes(query) ||
        event.id?.toLowerCase().includes(query) ||
        event.type?.toLowerCase().includes(query),
    );
    return filtered.sort((a, b) => {
      const aStatus = getEventLifecycleStatus(a);
      const bStatus = getEventLifecycleStatus(b);
      const rankDiff = lifecycleRank(aStatus) - lifecycleRank(bStatus);
      if (rankDiff !== 0) return rankDiff;

      const aTime = toEventTimeValue(a);
      const bTime = toEventTimeValue(b);
      if (aStatus === "past") return bTime - aTime;
      return aTime - bTime;
    });
  }, [events, searchQuery]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (parsedAbout.error) {
        throw new Error("About JSON is invalid");
      }
      const repeatPayload: EventItem["repeat"] = {
        enabled: type === "class" && repeatEnabled,
        frequency: type === "class" && repeatEnabled ? repeatFrequency : "none",
        interval: Math.max(1, Number(repeatInterval) || 1),
        until:
          type === "class" && repeatEnabled && repeatUntil.trim().length > 0
            ? repeatUntil
            : "",
        occurrences:
          type === "class" &&
          repeatEnabled &&
          repeatOccurrences.trim().length > 0
            ? Math.max(1, Number(repeatOccurrences) || 1)
            : null,
        daysOfWeek:
          type === "class" && repeatEnabled && repeatFrequency === "weekly"
            ? repeatDaysOfWeek
            : [],
      };

      const normalizedDateTime = splitDateTimeLocalValue(dateTime);

      const payload = {
        id,
        title,
        description,
        price: Number(price),
        original_price:
          originalPrice.trim().length > 0 ? Number(originalPrice) : undefined,
        photo,
        drop_in_price:
          dropInPrice.trim().length > 0 ? Number(dropInPrice) : undefined,
        images: toList(images),
        media: toList(media),
        placename,
        venue,
        category,
        date: normalizedDateTime.date,
        time: normalizedDateTime.time,
        location,
        type,
        repeat: repeatPayload,
        isActive,
        about: parsedAbout.value,
      };

      const event =
        mode === "create"
          ? await createEvent(payload)
          : await updateEvent(id, payload);
      setResult(event);
      if (mode === "update") {
        setEvents((prev) =>
          prev.map((item) => (item.id === event.id ? event : item)),
        );
      } else {
        setEvents((prev) => [
          event,
          ...prev.filter((item) => item.id !== event.id),
        ]);
      }
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

  const handleDeleteEvent = async (event: EventItem) => {
    const confirmed =
      typeof window !== "undefined"
        ? window.confirm(`Delete event \"${event.title}\" (${event.id})?`)
        : false;
    if (!confirmed) return;

    setDeletingId(event.id);
    setError(null);
    try {
      await deleteEvent(event.id);
      setEvents((prev) => prev.filter((item) => item.id !== event.id));
      if (id === event.id) {
        setMode("create");
        setId("");
        setResult(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">
            Manage events, workshops & classes
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Create or update event/workshop/class details. Upload images or
            videos below.
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

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">View events</p>
            <p className="text-xs text-white/60">
              Select any event to load it into the form for editing.
            </p>
          </div>
          <button
            type="button"
            onClick={loadEvents}
            disabled={eventsLoading}
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {eventsLoading ? "Refreshing..." : "Refresh list"}
          </button>
        </div>

        <input
          className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title, ID, or type"
        />

        {eventsError && (
          <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
            {eventsError}
          </div>
        )}

        <div className="mt-3 max-h-64 space-y-2 overflow-auto pr-1">
          {eventsLoading && events.length === 0 ? (
            <p className="text-xs text-white/60">Loading events...</p>
          ) : filteredEvents.length === 0 ? (
            <p className="text-xs text-white/60">No events found.</p>
          ) : (
            filteredEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2 text-xs text-white/60">
                  <span>{event.type}</span>
                  <div className="flex items-center gap-2">
                    <span>{event.date}</span>
                    <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-white/80">
                      {getEventLifecycleStatus(event)}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-sm font-semibold text-white">
                  {event.title}
                </p>
                <p className="text-xs text-white/60">{event.id}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => applyEventToForm(event)}
                    className="rounded-full border border-white/25 px-3 py-1 text-xs font-semibold text-white/90 hover:border-white/50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(event)}
                    disabled={deletingId === event.id}
                    className="rounded-full border border-red-500/50 px-3 py-1 text-xs font-semibold text-red-200 hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === event.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

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
            <span className="text-sm font-semibold text-white">
              Event/Workshop/Class ID
            </span>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="evt-delhi-night or wrk-acting-101"
              required
            />
            <span className="text-xs text-white/50">
              Use prefixes like <strong>evt-</strong> for events and
              <strong> wrk-</strong> for workshops and <strong> cls-</strong>
              for classes for easy admin identification.
            </span>
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

        <div
          className={`grid gap-4 ${type === "class" ? "md:grid-cols-4" : "md:grid-cols-3"}`}
        >
          <label className="space-y-2">
            <span className="text-sm font-semibold text-white">
              {type === "class" ? "Monthly price" : "Price"}
            </span>
            <input
              type="number"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </label>
          {type === "class" && (
            <label className="space-y-2">
              <span className="text-sm font-semibold text-white">
                Drop-in price
              </span>
              <input
                type="number"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                value={dropInPrice}
                onChange={(e) => setDropInPrice(e.target.value)}
                placeholder="e.g. 499"
              />
              <span className="text-xs text-white/50">
                Per single class session
              </span>
            </label>
          )}
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
            <span className="text-sm font-semibold text-white">
              Date & Time
            </span>
            <input
              type="datetime-local"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
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
              <option value="workshop">Workshop</option>
              <option value="class">Class</option>
            </select>
          </label>
        </div>

        {type === "class" && (
          <div className="space-y-4 rounded-2xl border border-white/10 bg-black/30 p-4">
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={repeatEnabled}
                onChange={(e) => setRepeatEnabled(e.target.checked)}
              />
              Repeat this class
            </label>

            {repeatEnabled && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-white">
                      Repeat frequency
                    </span>
                    <select
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                      value={repeatFrequency}
                      onChange={(e) =>
                        setRepeatFrequency(
                          e.target.value as "daily" | "weekly" | "monthly",
                        )
                      }
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-white">
                      Every (interval)
                    </span>
                    <input
                      type="number"
                      min={1}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                      value={repeatInterval}
                      onChange={(e) => setRepeatInterval(e.target.value)}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-white">
                      Repeat until (optional)
                    </span>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                      value={repeatUntil}
                      onChange={(e) => setRepeatUntil(e.target.value)}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-white">
                      Max occurrences (optional)
                    </span>
                    <input
                      type="number"
                      min={1}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                      value={repeatOccurrences}
                      onChange={(e) => setRepeatOccurrences(e.target.value)}
                      placeholder="e.g. 12"
                    />
                  </label>
                </div>

                {/* Day of Week Selector */}
                {repeatFrequency === "weekly" && (
                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-white">
                      Select days for this class
                    </span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {[
                        { day: 0, label: "Sun" },
                        { day: 1, label: "Mon" },
                        { day: 2, label: "Tue" },
                        { day: 3, label: "Wed" },
                        { day: 4, label: "Thu" },
                        { day: 5, label: "Fri" },
                        { day: 6, label: "Sat" },
                      ].map(({ day, label }) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            setRepeatDaysOfWeek((prev) =>
                              prev.includes(day)
                                ? prev.filter((d) => d !== day)
                                : [...prev, day].sort(),
                            );
                          }}
                          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                            repeatDaysOfWeek.includes(day)
                              ? "border-rose-600 bg-rose-600/20 text-white"
                              : "border border-white/20 bg-white/5 text-white/70 hover:border-white/40"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Date Preview */}
                {repeatFrequency === "weekly" &&
                  repeatDaysOfWeek.length > 0 &&
                  dateTime && (
                    <div className="space-y-2">
                      <span className="text-sm font-semibold text-white">
                        Preview: Upcoming class dates
                      </span>
                      <div className="max-h-48 overflow-auto rounded-lg border border-white/10 bg-black/50 p-3">
                        <div className="grid gap-2 text-xs text-white/70">
                          {generateClassDates(
                            splitDateTimeLocalValue(dateTime).date,
                            repeatDaysOfWeek,
                            repeatUntil,
                            repeatOccurrences
                              ? Number(repeatOccurrences)
                              : undefined,
                          ).map((date, idx) => (
                            <div
                              key={date}
                              className="flex items-center justify-between rounded border border-white/10 bg-black/30 px-2 py-1"
                            >
                              <span>
                                {new Date(date).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <span className="text-white/50">#{idx + 1}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

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
              ? "Create event/workshop/class"
              : "Update event/workshop/class"}
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
