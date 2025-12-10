import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["nodejs-polars"],
  // Note: COOP/COEP headers removed - they were for WebContainer API support
  // but block cross-origin iframes like Anchor Browser live view
};

export default nextConfig;
