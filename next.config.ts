import type { NextConfig } from "next";
import { siteConfig } from "./lib/site";

const isStaticExport = process.env.STATIC_EXPORT === "true";
const basePath = process.env.BASE_PATH?.replace(/\/$/, "") ?? "";

const nextConfig: NextConfig = {
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
    ],
    ...(isStaticExport ? { unoptimized: true } : {}),
  },
  ...(isStaticExport
    ? {
        output: "export",
        trailingSlash: true,
      }
    : {}),
  // LAN IP 等で dev server にアクセスしたときの HMR WebSocket エラーを防ぐ
  allowedDevOrigins: ["192.168.1.7"],
  ...(!isStaticExport
    ? {
        async headers() {
          if (siteConfig.allowSearchIndexing) {
            return [];
          }

          return [
            {
              source: "/:path*",
              headers: [
                {
                  key: "X-Robots-Tag",
                  value: "noindex, nofollow, noarchive, nosnippet",
                },
              ],
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
