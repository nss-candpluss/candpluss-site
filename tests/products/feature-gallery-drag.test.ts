import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const featureGallerySource = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../../components/products/product-detail/ProductDetailFeatureSection.tsx"
  ),
  "utf8"
);

describe("ProductDetailFeatureImageGallery touch drag", () => {
  it("moves the current and adjacent images with the pointer", () => {
    expect(featureGallerySource).toContain(
      "translate3d(calc(-100% + ${dragOffsetX}px), 0, 0)"
    );
    expect(featureGallerySource).toContain(
      "translate3d(calc(100% + ${dragOffsetX}px), 0, 0)"
    );
    expect(featureGallerySource).toContain(
      "translate3d(${dragOffsetX}px, 0, 0)"
    );
    expect(featureGallerySource).toContain("setDragOffsetX(deltaX)");
  });

  it("keeps vertical scrolling and snaps after horizontal touch drag", () => {
    expect(featureGallerySource).toContain(
      'event.pointerType !== "touch"'
    );
    expect(featureGallerySource).toContain("touch-pan-y");
    expect(featureGallerySource).toContain(
      "const threshold = Math.max(48, width * 0.12)"
    );
    expect(featureGallerySource).toContain(
      "pendingCommitIndexRef.current = wrapIndex("
    );
    expect(featureGallerySource).toContain(
      "settleToIndex(pendingIndex)"
    );
  });
});
