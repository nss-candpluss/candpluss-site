import type {
  OpenCloseGroupId,
  Product,
  ProductImage,
  ProductVariant,
  VariantGallery,
} from "@/types/product";

const DEFAULT_OPEN_CLOSE_GROUP: OpenCloseGroupId = "open";

export function getActiveGalleryImages(
  gallery: VariantGallery,
  groupId: OpenCloseGroupId = DEFAULT_OPEN_CLOSE_GROUP
): ProductImage[] {
  if (gallery.type === "standard") {
    return gallery.images;
  }

  const group =
    gallery.groups.find((item) => item.id === groupId) ?? gallery.groups[0];

  return group?.images ?? [];
}

export function isOpenCloseGallery(
  gallery: VariantGallery
): gallery is Extract<VariantGallery, { type: "openClose" }> {
  return gallery.type === "openClose";
}

export function getVariantChipImage(variant: ProductVariant): ProductImage | null {
  const images = getActiveGalleryImages(variant.gallery);

  return images[0] ?? null;
}

export function getProductListingImage(
  product: Product,
  variantId?: string
): ProductImage | null {
  const variant =
    product.variants.find((item) => item.id === variantId) ?? product.variants[0];

  if (!variant) {
    return null;
  }

  return getVariantChipImage(variant);
}

export function getDefaultOpenCloseGroupId(): OpenCloseGroupId {
  return DEFAULT_OPEN_CLOSE_GROUP;
}

const CAROUSEL_GALLERY_PRODUCT_HANDLES = new Set(["moya500", "nokuta"]);

/** MOYA500 / NOKUTA はカルーセル、それ以外の複数画像は縦並び */
export function usesCarouselGallery(productHandle: string): boolean {
  return CAROUSEL_GALLERY_PRODUCT_HANDLES.has(productHandle);
}

/** Variant ギャラリー内の全画像（standard / openClose 両対応） */
export function getAllVariantGalleryImages(gallery: VariantGallery): ProductImage[] {
  if (gallery.type === "standard") {
    return gallery.images;
  }

  return gallery.groups.flatMap((group) => group.images);
}

export function getAllVariantGalleryImageSources(variant: ProductVariant): string[] {
  return getAllVariantGalleryImages(variant.gallery).map((image) => image.src);
}
