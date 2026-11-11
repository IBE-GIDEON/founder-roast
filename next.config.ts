import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // react-pdf and cheerio run only on the server; keep them out of the bundler.
  serverExternalPackages: ["@react-pdf/renderer", "cheerio", "undici"],
  poweredByHeader: false,
  // fonts read from disk by the roast-card renderer
  outputFileTracingIncludes: {
    "/api/card/[id]": ["./assets/fonts/**"],
  },
};

export default nextConfig;
