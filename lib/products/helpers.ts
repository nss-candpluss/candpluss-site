import { productDefaultColorNameByHandlePrefix } from "@/data/product-default-variants";
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

function normalizeColorName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function matchesHandlePrefix(handle: string, prefix: string) {
  return handle === prefix || handle.startsWith(`${prefix}_`);
}

function getPreferredDefaultVariant(
  product: Pick<Product, "handle" | "variants">
) {
  const rule = productDefaultColorNameByHandlePrefix.find((item) =>
    matchesHandlePrefix(product.handle, item.handlePrefix)
  );

  if (!rule) {
    return undefined;
  }

  const wanted = normalizeColorName(rule.colorName);

  return product.variants.find(
    (variant) => normalizeColorName(variant.colorName) === wanted
  );
}

export function resolveProductVariantId(
  product: Product,
  variantId?: string | null
): string {
  if (variantId && product.variants.some((variant) => variant.id === variantId)) {
    return variantId;
  }

  return getPreferredDefaultVariant(product)?.id ?? product.variants[0]?.id ?? "";
}

/** Next.js が日本語ハンドルをパーセントエンコードしたまま渡すことがある */
export function normalizeProductHandle(handle: string): string {
  try {
    return decodeURIComponent(handle);
  } catch {
    return handle;
  }
}

/** Shopify のオプション名が英数字に変換できない場合の代替 */
const DEFAULT_VARIANT_PARAM_NAME = "color";

/**
 * バリアント指定に使う URL のクエリ名。Shopify のオプション名から決まるため
 * （Color → ?color=、Size → ?size=）、商品追加時にサイト側の設定は不要。
 */
export function getProductVariantParamName(
  product: Pick<Product, "variantOptionName">
): string {
  const slug = product.variantOptionName
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || DEFAULT_VARIANT_PARAM_NAME;
}

export function getProductDetailHref(
  product: Pick<Product, "handle" | "variantOptionName">,
  variantId?: string
): string {
  const baseHref = `/products/${product.handle}`;

  if (!variantId || isPlaceholderProductVariantId(variantId)) {
    return baseHref;
  }

  return `${baseHref}?${getProductVariantParamName(product)}=${encodeURIComponent(variantId)}`;
}

export function getSelectedVariant(product: Product, variantId?: string | null) {
  const resolvedId = resolveProductVariantId(product, variantId);

  return product.variants.find((variant) => variant.id === resolvedId) ?? null;
}

const PLACEHOLDER_VARIANT_NAME = /^(default title|default)$/i;

type ProductWithVariantNames = {
  variants: ReadonlyArray<Pick<ProductVariant, "colorName">>;
};

/** Shopify 未設定バリアント（Default Title）やローカルの DEFAULT */
export function isPlaceholderProductVariantName(name?: string | null): boolean {
  return !name?.trim() || PLACEHOLDER_VARIANT_NAME.test(name.trim());
}

/**
 * 未設定バリアント名から生成された ID（Default Title → default-title）。
 * 選択肢が実質ないため、URL に ?color= として出さない。
 */
export function isPlaceholderProductVariantId(variantId?: string | null): boolean {
  return isPlaceholderProductVariantName(variantId?.replace(/-/g, " "));
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
