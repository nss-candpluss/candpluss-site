import { describe, expect, it } from "vitest";

import { buildProductDetailGallery } from "@/components/products/product-detail/gallery-items";
import type { Product, ProductVariant } from "@/types/product";

const product = {
  handle: "moya500",
  title: "MOYA500",
} as Product;

describe("buildProductDetailGallery", () => {
  it("uses Shopify gallery media for every product handle", () => {
    const variant = {
      galleryMedia: [
        {
          id: "image-1",
          kind: "image",
          src: "https://cdn.shopify.com/image-1.webp",
          alt: "Shopify image",
        },
        {
          id: "video-1",
          kind: "video",
          src: "https://cdn.shopify.com/video.mp4",
          poster: "https://cdn.shopify.com/poster.webp",
        },
      ],
      gallery: {
        type: "standard",
        images: [{ src: "/fallback.webp", alt: "Fallback" }],
      },
    } as ProductVariant;

    expect(buildProductDetailGallery(product, variant)).toEqual([
      {
        id: "image-1",
        kind: "image",
        src: "https://cdn.shopify.com/image-1.webp",
        thumbnailSrc: "https://cdn.shopify.com/image-1.webp",
        alt: "Shopify image",
      },
      {
        id: "video-1",
        kind: "video",
        src: "https://cdn.shopify.com/video.mp4",
        poster: "https://cdn.shopify.com/poster.webp",
        thumbnailPoster: "https://cdn.shopify.com/poster.webp",
        alt: "MOYA500",
      },
    ]);
  });

  it("uses the standard gallery without a MOYA500-specific fallback", () => {
    const variant = {
      gallery: {
        type: "standard",
        images: [{ src: "/registered.webp", alt: "Registered image" }],
      },
    } as ProductVariant;

    expect(buildProductDetailGallery(product, variant)).toEqual([
      {
        id: "product-gallery-0-/registered.webp",
        kind: "image",
        src: "/registered.webp",
        thumbnailSrc: "/registered.webp",
        alt: "Registered image",
      },
    ]);
  });

  it("flattens open and close gallery groups in their registered order", () => {
    const variant = {
      gallery: {
        type: "openClose",
        groups: [
          {
            id: "open",
            label: "OPEN",
            images: [{ src: "/open.webp", alt: "Open" }],
          },
          {
            id: "close",
            label: "CLOSE",
            images: [{ src: "/close.webp", alt: "Close" }],
          },
        ],
      },
    } as ProductVariant;

    expect(
      buildProductDetailGallery(
        { ...product, handle: "another-product" },
        variant
      ).map((item) => item.src)
    ).toEqual(["/open.webp", "/close.webp"]);
  });

  it("returns an empty gallery when a product has no variant", () => {
    expect(buildProductDetailGallery(product, null)).toEqual([]);
  });
});
