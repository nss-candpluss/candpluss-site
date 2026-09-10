import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { siteConfig } from "@/lib/site";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath: string) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

const faviconFiles = [
  "app/favicon.ico",
  "app/icon.svg",
  "app/apple-icon.png",
  "public/apple-touch-icon.png",
  "public/favicon-96x96.png",
  "public/favicon.ico",
  "public/favicon.svg",
  "public/site.webmanifest",
  "public/web-app-manifest-192x192.png",
  "public/web-app-manifest-512x512.png",
] as const;

describe("favicon set", () => {
  it("keeps the generated favicon files in public/", () => {
    for (const relativePath of faviconFiles) {
      expect(existsSync(join(rootDir, relativePath))).toBe(true);
    }
  });

  it("exposes favicon, apple, and manifest metadata from the root layout", () => {
    const layoutSource = readSource("app/layout.tsx");

    expect(layoutSource).toContain('url: "/favicon.svg"');
    expect(layoutSource).toContain('sizes: "any"');
    expect(layoutSource).toContain('url: "/favicon-96x96.png"');
    expect(layoutSource).toContain('url: "/apple-touch-icon.png"');
    expect(layoutSource).toContain('manifest: "/site.webmanifest"');
    expect(layoutSource).toContain("applicationName: siteConfig.name");
    expect(layoutSource).toContain("export const viewport");
    expect(layoutSource).toContain('themeColor: "#ffffff"');
  });

  it("uses the site name and relative icon paths in the web manifest", () => {
    const manifest = JSON.parse(readSource("public/site.webmanifest")) as {
      name: string;
      short_name: string;
      icons: { src: string }[];
    };

    expect(manifest.name).toBe(siteConfig.name);
    expect(manifest.short_name).toBe(siteConfig.name);
    expect(manifest.icons.map((icon) => icon.src)).toEqual([
      "web-app-manifest-192x192.png",
      "web-app-manifest-512x512.png",
    ]);
  });
});
