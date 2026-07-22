import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.printify.com" },
      { protocol: "https", hostname: "cdn.printify.com" },
    ],
    unoptimized: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
