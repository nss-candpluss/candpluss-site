import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { homeLabContent } from "@/data/home";

const testDir = dirname(fileURLToPath(import.meta.url));
const homeLabSource = readFileSync(join(testDir, "../../sections/home/HomeLab.tsx"), "utf8");
const slideshowSource = readFileSync(
  join(testDir, "../../sections/home/HomeLabSlideshow.tsx"),
  "utf8"
);

describe("home lab slideshow", () => {
  it("lists nine slides in order", () => {
    expect(homeLabContent.slides).toEqual(
      Array.from(
        { length: 9 },
        (_, index) => `/images/home/home-slide-${String(index + 1).padStart(2, "0")}.webp`
      )
    );
  });

  it("keeps the section static and delegates to the client slideshow", () => {
    expect(homeLabSource).toContain("<HomeLabSlideshow slides={homeLabContent.slides} />");
    expect(homeLabSource).not.toContain('"use client"');
    expect(homeLabSource).not.toContain("sticky");
  });

  it("autoplays every 5 seconds with fade, gallery controls, dots and swipe", () => {
    expect(slideshowSource).toContain('"use client"');
    expect(slideshowSource).toContain("AUTOPLAY_INTERVAL_MS = 5000");
    expect(slideshowSource).toContain("transition-opacity");
    expect(slideshowSource).toContain("<ProductGalleryControls");
    expect(slideshowSource).toContain('className="pointer-coarse:hidden"');
    expect(slideshowSource).toContain('index === activeIndex ? "size-[11px] bg-white" : "size-[8px] bg-[#ccc]"');
    expect(slideshowSource).toContain("onPointerUp={handlePointerUp}");
    expect(slideshowSource).toContain("h-svh");
    expect(slideshowSource).not.toContain("ScrollTrigger");
  });

  it("serves the original files without re-encoding", () => {
    expect(slideshowSource).toContain("unoptimized");
  });
});
