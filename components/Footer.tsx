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

  return (
    <footer className="border-t border-white/10 bg-black/40 text-xs text-white/70 py-2 w-full">
      <div className="flex flex-col items-center gap-1">
        <div className="flex gap-4 mb-1">
          {contactItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              aria-label={item.label}
              className="hover:text-white text-lg"
            >
              {item.icon}
            </a>
          ))}
        </div>
        <span>© {new Date().getFullYear()} All Stars Studios</span>
      </div>
    </footer>
  );
}
