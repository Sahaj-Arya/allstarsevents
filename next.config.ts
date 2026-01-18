import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "api.dev.events.allstarsstudio.in",
        pathname: "/uploads/**",
      },
    ],
  },
  allowedDevOrigins: [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://192.168.1.39",
    "http://192.168.1.39:3000",
    "http://192.168.1.39:3001",
    "http://0.0.0.0",
    "http://0.0.0.0:3000",
    "http://0.0.0.0:3001",
  ],
};

export default nextConfig;
