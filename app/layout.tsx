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

// export const metadata: Metadata = {
//   title: "AllStars Studio",
//   description: "Welcome to Donny's",
// };

export const metadata = {
  title: "AllStars Studio",
  description: "Welcome to Donny's",

  openGraph: {
    title: "AllStars Studio",
    images: ["../public/allstars_studio.png"],
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
