import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent node-ical (and its deps) from being bundled by Turbopack/webpack
  serverExternalPackages: ["node-ical", "ical", "node-ical/lib/ical"],
  images: {
    unoptimized: false,
  },
};

export default nextConfig;
