import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  conceptSectionNavSpanClassName,
  conceptStoryContentSpanClassName,
  conceptStoryHeadingSpanClassName,
  definitionLabelSpanClassName,
  definitionValueSpanClassName,
  formHalfSpanClassName,
  fullSpanClassName,
  productCardSpanClassName,
  siteGridClassName,
  standardCardSpanClassName,
  threeColumnFeatureSpanClassName,
  twoColumnFeatureSpanClassName,
} from "@/lib/layout";

const siteGridSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../components/ui/SiteGrid.tsx"),
  "utf8"
);

const globalsCss = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../app/globals.css"),
  "utf8"
);

describe("12 column site grid", () => {
  it("defines a shared 12-column grid shell", () => {
    expect(siteGridClassName).toBe("grid grid-cols-12");
    expect(fullSpanClassName).toBe("col-span-12");
    expect(siteGridSource).toContain("siteGridClassName");
    expect(globalsCss).toContain('@source "../lib/layout.ts";');
  });

  it("defines responsive listing and feature spans", () => {
    expect(standardCardSpanClassName).toContain(
      "col-span-12 min-[768px]:col-span-6 min-[1024px]:col-span-4"
    );
    expect(productCardSpanClassName).toContain(
      "col-span-12 min-[640px]:col-span-6 min-[1024px]:col-span-4"
    );
    expect(twoColumnFeatureSpanClassName).toContain(
      "col-span-12 min-[768px]:col-span-6"
    );
    expect(threeColumnFeatureSpanClassName).toContain(
      "col-span-12 min-[768px]:col-span-4"
    );
  });

  it("defines form and definition-list spans", () => {
    expect(formHalfSpanClassName).toContain(
      "col-span-12 min-[640px]:col-span-6"
    );
    expect(definitionLabelSpanClassName).toContain(
      "col-span-12 min-[768px]:col-span-3"
    );
    expect(definitionValueSpanClassName).toContain(
      "col-span-12 min-[768px]:col-span-9"
    );
  });

  it("keeps the Concept menu at three columns and centers story content", () => {
    expect(conceptSectionNavSpanClassName).toBe("col-span-3");
    expect(conceptStoryHeadingSpanClassName).toBe("col-span-12");
    expect(conceptStoryContentSpanClassName).toBe("col-span-12");
  });
});
