import React from "react";

export const metadata = {
  title: "Terms & Conditions - AllStars Studio",
  description:
    "Terms and conditions for using AllStars Studio services and site.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-white">
      <h1 className="text-2xl font-semibold mb-4">Terms &amp; Conditions</h1>

      <p className="mb-3 text-sm text-white/80">
        Welcome to AllStars Studio. These Terms &amp; Conditions govern your use
        of our website and services. By accessing or using our site you agree to
        be bound by these terms.
      </p>

      <section className="mb-4">
        <h2 className="font-medium">1. Use of Service</h2>
        <p className="text-sm text-white/80">
          You agree to use our services only for lawful purposes and not to
          engage in any fraudulent activities. The studio reserves the right to
          refuse service.
        </p>
      </section>

      <section className="mb-4">
        <h2 className="font-medium">2. Bookings &amp; Tickets</h2>
        <p className="text-sm text-white/80">
          Bookings and ticket purchases are subject to availability. Please
          review the event-specific details before purchase. Tickets are
          non-transferable unless otherwise specified.
        </p>
      </section>

      <section className="mb-4">
        <h2 className="font-medium">3. Liability</h2>
        <p className="text-sm text-white/80">
          AllStars Studio is not liable for any indirect, incidental or
          consequential damages arising from use of the site or attendance at
          events, except where prohibited by law.
        </p>
      </section>

      <p className="text-sm text-white/70">Last updated: January 2026</p>
    </div>
  );
}
