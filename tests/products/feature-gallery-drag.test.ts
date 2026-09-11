import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  createFeatureTrack,
  settleFeatureTrack,
} from "../../components/products/product-detail/feature-track";

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
      "translate3d(calc(${slot.position * 100}% + ${dragOffsetX}px), 0, 0)"
    );
    expect(featureGallerySource).toContain(
      "setDragOffsetX(clampDragOffset(deltaX))"
    );
  });

  it("keeps vertical scrolling and snaps after horizontal touch drag", () => {
    expect(featureGallerySource).toContain('event.pointerType !== "touch"');
    expect(featureGallerySource).toContain("touch-pan-y");
    expect(featureGallerySource).toContain(
      "const threshold = Math.max(48, width * 0.12)"
    );
    expect(featureGallerySource).toContain("imageIndex: wrapIndex(selectedIndex + direction, images.length)");
  });

  it("keys each slide by its track slot so committing never remounts it", () => {
    expect(featureGallerySource).toContain("key={slot.id}");
  });
});

describe("settleFeatureTrack", () => {
  it("hands the arriving slot the centre position without changing its image", () => {
    const slots = createFeatureTrack(4);
    const arriving = slots.find((slot) => slot.position === 1);
    const settled = settleFeatureTrack(slots, 1, 1, 4);
    const centre = settled.find((slot) => slot.position === 0);

    expect(centre?.id).toBe(arriving?.id);
    expect(centre?.imageIndex).toBe(arriving?.imageIndex);
  });

  it("keeps the same slot ids so React reuses every slide element", () => {
    const slots = createFeatureTrack(4);
    const settled = settleFeatureTrack(slots, 1, 1, 4);

    expect(settled.map((slot) => slot.id).sort()).toEqual(
      slots.map((slot) => slot.id).sort()
    );
    expect(settled.map((slot) => slot.position).sort()).toEqual([-1, 0, 1]);
  });

  it("refills both neighbours around the new centre", () => {
    const settled = settleFeatureTrack(createFeatureTrack(4), 1, 1, 4);

    expect(settled.find((slot) => slot.position === -1)?.imageIndex).toBe(0);
    expect(settled.find((slot) => slot.position === 1)?.imageIndex).toBe(2);
  });

  it("wraps around when stepping backwards from the first image", () => {
    const slots = createFeatureTrack(4);
    const arriving = slots.find((slot) => slot.position === -1);
    const settled = settleFeatureTrack(slots, 3, -1, 4);
    const centre = settled.find((slot) => slot.position === 0);

    expect(centre?.id).toBe(arriving?.id);
    expect(centre?.imageIndex).toBe(3);
    expect(settled.find((slot) => slot.position === -1)?.imageIndex).toBe(2);
    expect(settled.find((slot) => slot.position === 1)?.imageIndex).toBe(0);
  });

  it("still reuses the arriving slot when the gallery only has two images", () => {
    const slots = createFeatureTrack(2);
    const arriving = slots.find((slot) => slot.position === 1);
    const settled = settleFeatureTrack(slots, 1, 1, 2);
    const centre = settled.find((slot) => slot.position === 0);

    expect(centre?.id).toBe(arriving?.id);
    expect(centre?.imageIndex).toBe(1);
    expect(arriving?.imageIndex).toBe(1);
  });
});
