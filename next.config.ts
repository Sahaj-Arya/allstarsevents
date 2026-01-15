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
};

export default nextConfig;
