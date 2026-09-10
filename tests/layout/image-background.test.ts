import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function source(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

const imageBackgroundSources = [
  "components/products/ProductCard.tsx",
  "components/news/NewsCard.tsx",
  "components/products/product-detail/ProductDetailFeatureSection.tsx",
  "app/news/[handle]/page.tsx",
  "sections/labo/LaboActivities.tsx",
] as const;

describe("image background color", () => {
  it("defines --color-line as #ECEEF0", () => {
    const globalsSource = source("app/globals.css");

    expect(globalsSource).toContain("--color-line: #ECEEF0;");
    expect(globalsSource).not.toContain("#ded9cf");
  });

  it("keeps image frames on --color-line", () => {
    for (const path of imageBackgroundSources) {
      expect(source(path)).toContain("bg-[var(--color-line)]");
    }
  });
});
