import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold text-white">Admin</h1>
      <p className="mt-2 text-sm text-white/70">
        Manage events, media, and ticket scanning.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/events"
          className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/80 hover:border-white/40"
        >
          <h2 className="text-lg font-semibold text-white">Create events</h2>
          <p className="mt-2 text-sm text-white/70">
            Add or update event details, media, and about sections.
          </p>
        </Link>
        <Link
          href="/admin/upload"
          className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/80 hover:border-white/40"
        >
          <h2 className="text-lg font-semibold text-white">Upload media</h2>
          <p className="mt-2 text-sm text-white/70">
            Upload images and videos for event galleries.
          </p>
        </Link>
        <Link
          href="/admin/tickets"
          className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/80 hover:border-white/40"
        >
          <h2 className="text-lg font-semibold text-white">Tickets lookup</h2>
          <p className="mt-2 text-sm text-white/70">
            Find tickets by phone number or ticket ID.
          </p>
        </Link>
        <Link
          href="/admin/validate"
          className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/80 hover:border-white/40"
        >
          <h2 className="text-lg font-semibold text-white">Scanner</h2>
          <p className="mt-2 text-sm text-white/70">
            Scan tickets and mark them as scanned.
          </p>
        </Link>
      </div>
    </div>
  );
}
