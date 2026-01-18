"use client";

import { FormEvent, useState } from "react";
import { uploadImage } from "../../../lib/api";

export default function UploadImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState<null | {
    id: string;
    url: string;
    path: string;
    filename: string;
    size: number;
    mime: string;
    createdAt: string;
  }>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await uploadImage(file);
      setUploaded(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!uploaded?.url) return;
    await navigator.clipboard.writeText(uploaded.url);
  };

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <h1 className="text-3xl font-semibold text-white">Upload media</h1>
      <p className="mt-2 text-sm text-white/70">
        Upload an image or video and get a public URL to use in events.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur"
      >
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-white">Media file</span>
          <input
            type="file"
            accept="image/*,video/*"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-white/20"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading || !file}
          className="w-full rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>

        {uploaded && (
          <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80">
            <div className="break-all">{uploaded.url}</div>
            <button
              type="button"
              onClick={handleCopy}
              className="mt-2 rounded-full border border-white/20 px-3 py-1 text-xs text-white hover:border-white"
            >
              Copy URL
            </button>
            <div className="mt-3 space-y-1 text-xs text-white/60">
              <div>ID: {uploaded.id}</div>
              <div>Path: {uploaded.path}</div>
              <div>Filename: {uploaded.filename}</div>
              <div>Type: {uploaded.mime}</div>
              <div>Size: {(uploaded.size / 1024).toFixed(1)} KB</div>
              <div>
                Created: {new Date(uploaded.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
