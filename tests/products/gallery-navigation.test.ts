import { describe, expect, it } from "vitest";

import { shouldDisplayGalleryNavigation } from "@/lib/products/gallery";

describe("shouldDisplayGalleryNavigation", () => {
  it("hides dots and arrows when the gallery has one item", () => {
    expect(shouldDisplayGalleryNavigation(1)).toBe(false);
    expect(shouldDisplayGalleryNavigation(0)).toBe(false);
  });

  it("shows navigation when the gallery has two or more items", () => {
    expect(shouldDisplayGalleryNavigation(2)).toBe(true);
  });
});
