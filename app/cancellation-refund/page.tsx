import React from "react";

export const metadata = {
  title: "Cancellation & Refund - AllStars Studio",
  description: "Cancellation and refund policies for AllStars Studio bookings.",
};

export default function CancellationRefundPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-white">
      <h1 className="text-2xl font-semibold mb-4">
        Cancellation &amp; Refund Policy
      </h1>

      <p className="mb-3 text-sm text-white/80">
        This page explains our policy regarding cancellations and refunds for
        bookings made with AllStars Studio. Please read the rules carefully
        before making a booking.
      </p>

      <section className="mb-4">
        <h2 className="font-medium">1. Cancellations</h2>
        <p className="text-sm text-white/80">
          Cancellations are accepted as per the event-specific terms. Some
          events may be non-refundable. Check the event details for exact
          cancellation windows.
        </p>
      </section>

      <section className="mb-4">
        <h2 className="font-medium">2. Refunds</h2>
        <p className="text-sm text-white/80">
          Refunds, when applicable, will be processed to the original payment
          method. The time taken to appear in your account depends on the
          payment provider.
        </p>
      </section>

      <section className="mb-4">
        <h2 className="font-medium">3. Event Cancellation by AllStars</h2>
        <p className="text-sm text-white/80">
          If AllStars Studio cancels an event, full refunds will be issued
          unless otherwise stated. We will communicate next steps to affected
          ticket holders.
        </p>
      </section>

      <p className="text-sm text-white/70">Last updated: January 2026</p>
    </div>
  );
}
