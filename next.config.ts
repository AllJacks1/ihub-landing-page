import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dinoanimals.com",
      },
      {
        protocol: "https",
        hostname: "**", // Allow ALL external images (less secure)
      },
    ],
  },
};

export default nextConfig;
