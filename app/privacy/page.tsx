import React from "react";

export const metadata = {
  title: "Privacy Policy - AllStars Studio",
  description: "How AllStars Studio collects and uses personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-white">
      <h1 className="text-2xl font-semibold mb-4">Privacy Policy</h1>

      <p className="mb-3 text-sm text-white/80">
        This Privacy Policy explains how AllStars Studio collects, uses and
        protects your personal information. By using our services you consent to
        the practices described in this policy.
      </p>

      <section className="mb-4">
        <h2 className="font-medium">1. Information We Collect</h2>
        <p className="text-sm text-white/80">
          We may collect personal details such as name, phone number, email and
          payment information necessary to process bookings and provide
          services.
        </p>
      </section>

      <section className="mb-4">
        <h2 className="font-medium">2. How We Use Data</h2>
        <p className="text-sm text-white/80">
          Data is used to process bookings, communicate with users, improve
          services, and comply with legal obligations. We do not sell your
          personal data.
        </p>
      </section>

      <section className="mb-4">
        <h2 className="font-medium">3. Security</h2>
        <p className="text-sm text-white/80">
          We implement reasonable security measures to protect personal
          information, but cannot guarantee absolute security. Please take
          precautions when sharing sensitive data.
        </p>
      </section>

      <p className="text-sm text-white/70">Last updated: January 2026</p>
    </div>
  );
}
