import { productCategories, type Product } from "@/types/product";

const LISTING_CATEGORY_ORDER = productCategories
  .filter((category) => category.slug !== "all")
  .map((category) => category.slug);

/** 一覧はカテゴリタブと同じ順。同一カテゴリ内は入力順を保つ */
export function sortProductsForListing<T extends { categorySlug: string }>(
  products: T[]
): T[] {
  const order = new Map<string, number>(
    LISTING_CATEGORY_ORDER.map((slug, index) => [slug, index])
  );
  const fallbackIndex = LISTING_CATEGORY_ORDER.length;

  return [...products].sort((a, b) => {
    const aIndex = order.get(a.categorySlug) ?? fallbackIndex;
    const bIndex = order.get(b.categorySlug) ?? fallbackIndex;
    return aIndex - bIndex;
  });
}

export function resolveProductVariantId(
  product: Product,
  variantId?: string | null
): string {
  if (variantId && product.variants.some((variant) => variant.id === variantId)) {
    return variantId;
  }

  return product.variants[0]?.id ?? "";
}

/** @deprecated URL param name remains `color` for compatibility */
export const resolveProductColorId = resolveProductVariantId;

/** Next.js が日本語ハンドルをパーセントエンコードしたまま渡すことがある */
export function normalizeProductHandle(handle: string): string {
  try {
    return decodeURIComponent(handle);
  } catch {
    return handle;
  }
}

export function getProductDetailHref(handle: string, variantId?: string): string {
  const baseHref = `/products/${handle}`;

  return variantId
    ? `${baseHref}?color=${encodeURIComponent(variantId)}`
    : baseHref;
}

export function getSelectedVariant(product: Product, variantId?: string | null) {
  return (
    product.variants.find((variant) => variant.id === variantId) ??
    product.variants[0] ??
    null
  );
}

/** 詳細ページの選択肢ラベル。Shopify のオプション名を大文字で表示する */
export function getProductVariantOptionName(product: Product): string {
  const name = product.variantOptionName?.trim();
  return name ? name.toUpperCase() : "COLOR";
}
