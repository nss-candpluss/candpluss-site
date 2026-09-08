import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { laboAboutContent } from "@/data/labo";

const laboAboutSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../sections/labo/LaboAbout.tsx"),
  "utf8"
);

const laboAboutGallerySource = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../../sections/labo/LaboAboutGallery.tsx"
  ),
  "utf8"
);

const laboPageSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../sections/labo/LaboPage.tsx"),
  "utf8"
);

describe("labo about section", () => {
  it("uses the about copy and two dummy gallery images", () => {
    expect(laboAboutContent.title).toBe("LABOについて");
    expect(laboAboutContent.label).toBe("ABOUT C AND+S LABO");
    expect(laboAboutContent.bodyTitle).toBe("製品をもっと深く知るための場所");
    expect(laboAboutContent.body).toContain(
      "MOYAシリーズの製品展示をはじめ、ZIG STAKEなど"
    );
    expect(laboAboutContent.images).toHaveLength(2);
  });

  it("follows the former HomeSupport two-column layout", () => {
    expect(laboAboutSource).toContain("min-[1025px]:grid-cols-2");
    expect(laboAboutSource).toContain("aspect-[13/10]");
    expect(laboAboutSource).toContain("min-[1025px]:row-span-3");
    expect(laboAboutSource).toContain("sectionTitle62ClassName");
    expect(laboAboutSource).toContain("uiText(18)");
    expect(laboAboutSource).toContain("uiText(21)");
    expect(laboAboutSource).toContain("bodyText(16)");
    expect(laboAboutSource).toContain("<LaboAboutGallery");
  });

  it("places the about block under the hero and drops Materials/Design scroll", () => {
    expect(laboPageSource).toContain("<LaboHero />");
    expect(laboPageSource).toContain("<LaboAbout />");
    expect(laboPageSource).toContain("<LaboActivities />");
    expect(laboPageSource).toContain("<LaboDesign />");
    expect(laboPageSource).toContain("<LaboVisit />");
    expect(laboPageSource).toContain("<LaboAccess />");
    expect(laboPageSource).not.toContain("LaboFeatureLinks");
    expect(laboPageSource).not.toContain("LaboScrollSection");
    expect(laboPageSource).not.toContain("LaboPageViewport");
  });

  it("switches dummy images with gallery controls", () => {
    expect(laboAboutGallerySource).toContain("ProductGalleryControls");
    expect(laboAboutGallerySource).toContain('"use client"');
  });
});
