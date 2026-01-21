import Link from "next/link";
import { FaInstagram, FaFacebook, FaEnvelope, FaPhone } from "react-icons/fa";

export function Footer() {
  const contactItems = [
    {
      label: "Instagram",
      href: "https://www.instagram.com/_allstarsstudio_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
      icon: <FaInstagram />,
    },
    {
      label: "Facebook",
      href: "https://www.facebook.com/Allstarsppage/",
      icon: <FaFacebook />,
    },
    {
      label: "Email",
      href: "mailto:support@allstarsstudio.in",
      icon: <FaEnvelope />,
    },
    {
      label: "Phone",
      href: "tel:+919910631123",
      icon: <FaPhone />,
    },
  ];

  const siteLinks = [
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Cancellation & Refund", href: "/cancellation-refund" },
  ];

  return (
    <footer className="border-t border-white/10 bg-black/40 text-xs text-white/70 py-4 w-full">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-4 text-lg">
            {contactItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
                className="hover:text-white"
              >
                {item.icon}
              </a>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 text-sm">
            {siteLinks.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white/90">
                {l.label}
              </Link>
            ))}
          </div>

          <div className="text-sm text-white/70 mt-1">
            <span>© {new Date().getFullYear()} AllStars Studios</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
