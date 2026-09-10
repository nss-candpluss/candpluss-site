import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { homeLabContent } from "@/data/home";

const homeLabSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../sections/home/HomeLab.tsx"),
  "utf8"
);

describe("home lab image", () => {
  it("renders a static full-viewport image without pin or scroll animation", () => {
    expect(homeLabContent.backgroundImage).toBe("/images/home/home-image.webp");
    expect(homeLabSource).toContain("h-svh");
    expect(homeLabSource).not.toContain("sticky");
    expect(homeLabSource).not.toContain("gsap");
    expect(homeLabSource).not.toContain("ScrollTrigger");
    expect(homeLabSource).not.toContain('"use client"');
  });
});
