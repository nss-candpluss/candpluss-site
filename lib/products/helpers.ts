import { productListingHandleOrder } from "@/data/product-listing-order";
import { productCategories, type Product, type ProductVariant } from "@/types/product";

const LISTING_CATEGORY_ORDER = productCategories
  .filter((category) => category.slug !== "all")
  .map((category) => category.slug);

/**
 * 一覧はカテゴリタブと同じ順。同一カテゴリ内は
 * `productListingHandleOrder` の指定順 → 残りは入力順。
 */
export function sortProductsForListing<
  T extends { handle: string; categorySlug: string },
>(products: T[]): T[] {
  const categoryOrder = new Map<string, number>(
    LISTING_CATEGORY_ORDER.map((slug, index) => [slug, index])
  );
  const handleOrder = new Map<string, number>(
    productListingHandleOrder.map((handle, index) => [handle, index])
  );
  const categoryFallback = LISTING_CATEGORY_ORDER.length;
  const handleFallback = productListingHandleOrder.length;

  return products
    .map((product, inputIndex) => ({ product, inputIndex }))
    .sort((a, b) => {
      const categoryDiff =
        (categoryOrder.get(a.product.categorySlug) ?? categoryFallback) -
        (categoryOrder.get(b.product.categorySlug) ?? categoryFallback);
      if (categoryDiff !== 0) {
        return categoryDiff;
      }

      const handleDiff =
        (handleOrder.get(a.product.handle) ?? handleFallback) -
        (handleOrder.get(b.product.handle) ?? handleFallback);
      if (handleDiff !== 0) {
        return handleDiff;
      }

      return a.inputIndex - b.inputIndex;
    })
    .map(({ product }) => product);
}

/** Shopify 経由の一覧では、ストアに存在する商品だけを残す */
export function keepShopifyListingProducts<T extends { handle: string; listingHidden?: boolean }>(
  products: T[],
  shopifyHandles: ReadonlySet<string>
): T[] {
  return products.filter(
    (product) => !product.listingHidden && shopifyHandles.has(product.handle)
  );
}

export function resolveProductPriceAmount(
  product: Pick<Product, "price">,
  variant?: Pick<ProductVariant, "price"> | null
): number {
  return variant?.price?.amount ?? product.price;
}

/** 金額 0 のときは ¥・税込を含む価格表示を出さない */
export function shouldDisplayProductPrice(
  product: Pick<Product, "price">,
  variant?: Pick<ProductVariant, "price"> | null
): boolean {
  return resolveProductPriceAmount(product, variant) !== 0;
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

const PLACEHOLDER_VARIANT_NAME = /^(default title|default)$/i;

type ProductWithVariantNames = {
  variants: ReadonlyArray<Pick<ProductVariant, "colorName">>;
};

/** Shopify 未設定バリアント（Default Title）やローカルの DEFAULT */
export function isPlaceholderProductVariantName(name?: string | null): boolean {
  return !name?.trim() || PLACEHOLDER_VARIANT_NAME.test(name.trim());
}

/** カラーチップは1つでも表示する */
export function shouldDisplayProductVariantOptions(
  product: ProductWithVariantNames
): boolean {
  return product.variants.length > 0;
}

export function shouldDisplayProductVariantLabel(
  product: ProductWithVariantNames,
  selectedVariant?: Pick<ProductVariant, "colorName"> | null
): boolean {
  const selectableCount = product.variants.filter(
    (variant) => !isPlaceholderProductVariantName(variant.colorName)
  ).length;

  return (
    selectableCount > 1 &&
    !isPlaceholderProductVariantName(selectedVariant?.colorName)
  );
}

/** 詳細ページの選択肢ラベル。Shopify のオプション名を大文字で表示する */
export function getProductVariantOptionName(product: Product): string {
  const name = product.variantOptionName?.trim();
  return name ? name.toUpperCase() : "COLOR";
}
