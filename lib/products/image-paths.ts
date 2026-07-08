import type { ProductImage } from "@/types/product";

/** 商品画像未配置時の共通プレースホルダー */
export const PRODUCT_IMAGE_PLACEHOLDER = "/images/products/_shared/placeholder.webp";

export function productImagePath(handle: string, filename: string): string {
  return `/images/products/${handle}/${filename}`;
}

export function photoImageFilename(index: number): string {
  return `photo-image-${String(index).padStart(2, "0")}.webp`;
}

export function featureImageFilename(index: number): string {
  return `feature-${String(index).padStart(2, "0")}.webp`;
}

export function drawingImageFilename(): string {
  return "drawing.webp";
}

export function buildPhotoImages(
  handle: string,
  title: string,
  count: number
): ProductImage[] {
  return Array.from({ length: count }, (_, index) => {
    const imageIndex = index + 1;

    return {
      src: productImagePath(handle, photoImageFilename(imageIndex)),
      alt: `${title} photo ${String(imageIndex).padStart(2, "0")}`,
    };
  });
}

export function coloredPhotoImageFilename(colorCode: string, index: number): string {
  return `${colorCode}-photo-image-${String(index).padStart(2, "0")}.webp`;
}

export function buildColoredPhotoImages(
  handle: string,
  title: string,
  colorCode: string,
  colorName: string,
  count: number
): ProductImage[] {
  return Array.from({ length: count }, (_, index) => {
    const imageIndex = index + 1;

    return {
      src: productImagePath(handle, coloredPhotoImageFilename(colorCode, imageIndex)),
      alt: `${title} ${colorName} photo ${String(imageIndex).padStart(2, "0")}`,
    };
  });
}

export function featureImagePath(handle: string, index: number): string {
  return productImagePath(handle, featureImageFilename(index));
}

export function coloredFeatureImagePath(
  handle: string,
  colorCode: string,
  index: number
): string {
  return productImagePath(handle, `${colorCode}-${featureImageFilename(index)}`);
}

export function parseFeatureIndex(featureId: string): number | null {
  const match = featureId.match(/^feature-(\d+)$/);

  if (!match) {
    return null;
  }

  return Number(match[1]);
}

export function resolveFeatureImageSrc(
  feature: { id: string; image?: string },
  options: {
    handle: string;
    colorCode?: string;
    colorKeyed?: boolean;
  }
): string | undefined {
  const index = parseFeatureIndex(feature.id);

  if (options.colorKeyed && options.colorCode && index !== null) {
    return coloredFeatureImagePath(options.handle, options.colorCode, index);
  }

  return feature.image;
}

export function drawingImagePath(handle: string): string {
  return productImagePath(handle, drawingImageFilename());
}

export function drawingImage(handle: string, alt: string): ProductImage {
  return {
    src: drawingImagePath(handle),
    alt,
  };
}
