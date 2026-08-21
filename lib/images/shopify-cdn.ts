const SHOPIFY_CDN_HOST = "cdn.shopify.com";

const CHIP_DELIVERY_WIDTH = 320;
const LISTING_DELIVERY_WIDTH = 1400;
const HERO_DELIVERY_WIDTH = 2400;

export function isShopifyCdnUrl(src: string) {
  try {
    return new URL(src, "https://candpluss.camp").hostname === SHOPIFY_CDN_HOST;
  } catch {
    return false;
  }
}

export function withShopifyCdnWidth(src: string, width: number) {
  if (!isShopifyCdnUrl(src)) {
    return src;
  }

  try {
    const url = new URL(src);
    url.searchParams.set("width", String(width));
    return url.toString();
  } catch {
    return src;
  }
}

export function shopifyDeliveryWidth(options: {
  width?: number | `${number}`;
  sizes?: string;
}) {
  const width =
    typeof options.width === "number"
      ? options.width
      : Number(options.width) || undefined;

  if (width && width <= 128) {
    return CHIP_DELIVERY_WIDTH;
  }

  const sizes = options.sizes?.trim() ?? "";
  const pxOnly = sizes.match(/^(\d+)px$/);

  if (pxOnly) {
    return Math.min(Math.max(Number(pxOnly[1]) * 3, CHIP_DELIVERY_WIDTH), 640);
  }

  if (sizes.includes("33vw")) {
    return LISTING_DELIVERY_WIDTH;
  }

  if (sizes.includes("vw")) {
    return HERO_DELIVERY_WIDTH;
  }

  return HERO_DELIVERY_WIDTH;
}
