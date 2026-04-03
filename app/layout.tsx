import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { GlobalLoader } from "../components/GlobalLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.allstarsstudio.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "AllStars Studio",
  description: "Welcome to Donny's",
  openGraph: {
    title: "AllStars Studio",
    description: "Welcome to Donny's",
    siteName: "AllStars Studio",
    type: "website",
    images: ["/assets/allstars_studio.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AllStars Studio",
    description: "Welcome to Donny's",
    images: ["/assets/allstars_studio.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-neutral-950 text-white min-h-screen flex flex-col`}
      >
        <Providers>
          <Header />
          <GlobalLoader />
          <main className="flex-1 bg-gradient-to-b from-neutral-950 via-slate-950 to-black">
            {children}
          </main>
        </Providers>
        <Footer />
      </body>
    </html>
  );
}
