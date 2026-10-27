import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Share the single .env at the repo root (Vercel injects env vars directly).
// forceReload: Next has already loaded (and cached) apps/web's env by now.
loadEnvConfig(path.resolve(process.cwd(), "../.."), process.env.NODE_ENV !== "production", undefined, true);

const nextConfig: NextConfig = {
  transpilePackages: ["@savemyseat/db"],
  experimental: {
    // Invitation images are resized in the browser first; this leaves headroom under Vercel's 4.5 MB cap.
    serverActions: { bodySizeLimit: "4mb" },
  },
  images: {
    // Neon Object Storage branch endpoints, e.g. br-xxx.storage.c-6.us-east-2.aws.neon.tech
    remotePatterns: [{ protocol: "https", hostname: "**.aws.neon.tech" }],
  },
};

export default nextConfig;
