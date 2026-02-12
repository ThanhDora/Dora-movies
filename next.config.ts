import type { NextConfig } from "next";

function getImageRemotePatterns() {
  const patterns: Array<{ protocol: "https" | "http"; hostname: string; pathname: string }> = [
    { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
    { protocol: "https", hostname: "platform-lookaside.fbsbx.com", pathname: "/**" },
  ];

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      const url = new URL(apiUrl);
      const hostname = url.hostname;
      if (hostname) {
        patterns.push(
          { protocol: url.protocol.replace(":", "") as "https" | "http", hostname, pathname: "/**" },
          { protocol: url.protocol.replace(":", "") as "https" | "http", hostname: `*.${hostname}`, pathname: "/**" }
        );
      }
    } catch {
      //
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: getImageRemotePatterns(),
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["@prisma/client"],
  },
};

export default nextConfig;
