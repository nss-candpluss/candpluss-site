import type { PageOgImage } from "@/lib/site-metadata";
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

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;
const SHOPIFY_CDN_HOSTNAME = "cdn.shopify.com";

/**
 * SNS プレビュー用に 1200×630 を Shopify CDN 側で切り出す。
 *
 * 形式は指定しない。CDN が `vary: Accept` で出し分けるため、WebP 非対応の
 * LINE / Facebook のクローラーには URL が .webp でも JPEG が返る
 * （`format=jpg` は Accept より優先されないので付けても効かない）。
 *
 * Shopify 以外（未配置時のローカル WebP プレースホルダー）は変換できず、
 * WebP のまま出すと LINE で表示されないため共通 OG 画像に委ねる。
 */
export function getProductOgImage(product: Product): PageOgImage | undefined {
  const src = getProductListingImage(product)?.src;

  if (!src) {
    return undefined;
  }

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return undefined;
  }

  if (url.hostname !== SHOPIFY_CDN_HOSTNAME) {
    return undefined;
  }

  url.searchParams.set("width", String(OG_IMAGE_WIDTH));
  url.searchParams.set("height", String(OG_IMAGE_HEIGHT));
  url.searchParams.set("crop", "center");

  return {
    url: url.toString(),
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
  };
}

/** ギャラリーが1枚のときはドット・サムネ矢印・拡大ナビを出さない */
export function shouldDisplayGalleryNavigation(itemCount: number): boolean {
  return itemCount > 1;
}
