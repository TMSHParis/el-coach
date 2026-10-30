import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "dev" },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
