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
        bookings made with AllStars Studio. Please note: <strong>all sales are
        final — no refunds will be issued under any circumstances.</strong>
        Read the details below before making a booking.
      </p>

      <section className="mb-4">
        <h2 className="font-medium">1. Cancellations</h2>
        <p className="text-sm text-white/80">
          All ticket sales are final. Customer-initiated cancellations are not
          accepted and no refunds will be provided.
        </p>
      </section>

      <section className="mb-4">
        <h2 className="font-medium">2. Refunds</h2>
        <p className="text-sm text-white/80">
          We do not offer refunds for any purchases. This applies to all
          payment methods and transactions. Please ensure you select the
          correct date and ticket quantity before completing your purchase.
        </p>
      </section>

      <section className="mb-4">
        <h2 className="font-medium">3. Event Cancellation by AllStars</h2>
        <p className="text-sm text-white/80">
          If AllStars Studio cancels an event, we will make reasonable efforts
          to offer a rescheduled date or a credit for future events. Refunds
          will not be issued.
        </p>
      </section>

      <p className="text-sm text-white/70">Last updated: January 2026</p>
    </div>
  );
}
