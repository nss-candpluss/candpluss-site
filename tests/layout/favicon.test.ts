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
  "public/apple-touch-icon.png",
  "public/favicon-96x96.png",
  "public/favicon.svg",
  "public/site.webmanifest",
  "public/web-app-manifest-192x192.png",
  "public/web-app-manifest-512x512.png",
] as const;

/** metadata.icons が優先されるため、これらを置くと配信されないルートが増えるだけ */
const duplicateIconFiles = ["app/icon.svg", "app/apple-icon.png"] as const;

describe("favicon set", () => {
  it("keeps the generated favicon files in public/", () => {
    for (const relativePath of faviconFiles) {
      expect(existsSync(join(rootDir, relativePath))).toBe(true);
    }
  });

  it("does not duplicate the icons as app/ file conventions", () => {
    for (const relativePath of duplicateIconFiles) {
      expect(existsSync(join(rootDir, relativePath))).toBe(false);
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
