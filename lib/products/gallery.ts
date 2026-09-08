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

/** ギャラリーが1枚のときはドット・サムネ矢印・拡大ナビを出さない */
export function shouldDisplayGalleryNavigation(itemCount: number): boolean {
  return itemCount > 1;
}
