import { products } from "@/data/products";

import type { Product, ProductCategorySlug } from "@/types/product";

export type { Product, ProductCategorySlug } from "@/types/product";

/**
 * 現在は data/products.ts を参照。
 * 将来は lib/shopify/products.ts 等へ差し替え。
 */
export async function getAllProducts(): Promise<Product[]> {
  return products;
}

export async function getListingProducts(): Promise<Product[]> {
  return products.filter((product) => !product.listingHidden);
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  return products.find((product) => product.handle === handle) ?? null;
}

export async function getProductsByHandles(handles: string[]): Promise<Product[]> {
  return handles
    .map((handle) => products.find((product) => product.handle === handle))
    .filter((product): product is Product => Boolean(product));
}

export async function getProductsByCategory(
  categorySlug: ProductCategorySlug
): Promise<Product[]> {
  const listingProducts = await getListingProducts();

  if (categorySlug === "all") {
    return listingProducts;
  }

  return listingProducts.filter((product) => product.categorySlug === categorySlug);
}

export async function getAllProductHandles(): Promise<string[]> {
  return products.map((product) => product.handle);
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

export function getProductDetailHref(handle: string, variantId?: string): string {
  const baseHref = `/products/${handle}`;

  if (!variantId) {
    return baseHref;
  }

  return `${baseHref}?color=${encodeURIComponent(variantId)}`;
}

export function getSelectedVariant(product: Product, variantId?: string | null) {
  return (
    product.variants.find((variant) => variant.id === variantId) ?? product.variants[0] ?? null
  );
}
