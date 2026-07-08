import type {
  OpenCloseGallery,
  ProductImage,
  StandardGallery,
  VariantGallery,
} from "@/types/product";
import { buildColoredPhotoImages, buildPhotoImages, PRODUCT_IMAGE_PLACEHOLDER, productImagePath } from "@/lib/products/image-paths";

const CAMERA_ANGLES = [
  "01-front",
  "02-front-right",
  "03-right",
  "05-front-left",
] as const;

const NOKUTA_CAMERA_ANGLES = [
  "01-front-right",
  "02-right",
  "03-front-left",
  "04-front",
] as const;

type BuildGalleryOptions = {
  handle: string;
  title: string;
  colorCode: string;
  colorName: string;
};

function buildImagePath(handle: string, filename: string): string {
  return productImagePath(handle, filename);
}

function buildImageAlt(title: string, colorName: string, angle: string): string {
  return `${title} ${colorName} ${angle}`;
}

export function buildStandardGallery({
  handle,
  title,
  colorCode,
  colorName,
}: BuildGalleryOptions): StandardGallery {
  const images: ProductImage[] = CAMERA_ANGLES.map((angle) => ({
    src: buildImagePath(handle, `${colorCode}-${angle}.webp`),
    alt: buildImageAlt(title, colorName, angle),
  }));

  return {
    type: "standard",
    images,
  };
}

export function buildNokutaStandardGallery({
  handle,
  title,
  colorCode,
  colorName,
}: BuildGalleryOptions): StandardGallery {
  const images: ProductImage[] = NOKUTA_CAMERA_ANGLES.map((angle) => ({
    src: buildImagePath(handle, `${colorCode}-${angle}.webp`),
    alt: buildImageAlt(title, colorName, angle),
  }));

  return {
    type: "standard",
    images,
  };
}

export function buildOpenCloseGallery({
  handle,
  title,
  colorCode,
  colorName,
}: BuildGalleryOptions): OpenCloseGallery {
  const buildGroupImages = (state: "open" | "close"): ProductImage[] =>
    CAMERA_ANGLES.map((angle) => ({
      src: buildImagePath(handle, `${colorCode}-${state}-${angle}.webp`),
      alt: buildImageAlt(title, colorName, `${state} ${angle}`),
    }));

  return {
    type: "openClose",
    groups: [
      {
        id: "open",
        label: "OPEN",
        images: buildGroupImages("open"),
      },
      {
        id: "close",
        label: "CLOSE",
        images: buildGroupImages("close"),
      },
    ],
  };
}

export function buildSimpleStandardGallery(handle: string, title: string): StandardGallery {
  const images: ProductImage[] = CAMERA_ANGLES.map((angle) => ({
    src: buildImagePath(handle, `${angle}.webp`),
    alt: `${title} ${angle}`,
  }));

  return {
    type: "standard",
    images,
  };
}

export function buildColoredStandardGallery(
  handle: string,
  title: string,
  colorCode: string,
  colorName: string
): VariantGallery {
  return buildStandardGallery({ handle, title, colorCode, colorName });
}

export function buildPhotoImageGallery(
  handle: string,
  title: string,
  count: number
): StandardGallery {
  return {
    type: "standard",
    images: buildPhotoImages(handle, title, count),
  };
}

export function buildColoredPhotoImageGallery({
  handle,
  title,
  colorCode,
  colorName,
  count,
}: BuildGalleryOptions & { count: number }): StandardGallery {
  return {
    type: "standard",
    images: buildColoredPhotoImages(handle, title, colorCode, colorName, count),
  };
}

const PLACEHOLDER_IMAGE = PRODUCT_IMAGE_PLACEHOLDER;

export function buildPlaceholderGallery(
  handle: string,
  title: string,
  placeholderSrc: string = PLACEHOLDER_IMAGE
): StandardGallery {
  return {
    type: "standard",
    images: Array.from({ length: 5 }, (_, index) => ({
      src: placeholderSrc,
      alt: `${title} ${index + 1}`,
    })),
  };
}
