import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const featureLinksSource = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../../components/products/ProductFeatureLinks.tsx"
  ),
  "utf8"
);

describe("ProductFeatureLinks", () => {
  it("uses a static text decoration instead of the animated underline", () => {
    expect(featureLinksSource).toContain(
      "underline decoration-1 underline-offset-[1px]"
    );
    expect(featureLinksSource).not.toContain("HoverUnderlineText");
    expect(featureLinksSource).not.toContain("groupHover");
  });
});
