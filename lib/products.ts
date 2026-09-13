import "server-only";

import {
  fetchAllProducts,
  fetchProductByHandle,
} from "@/lib/shopify/products";

import type { Product, ProductCategorySlug } from "@/types/product";
import {
  normalizeProductHandle,
  sortProductsForListing,
} from "@/lib/products/helpers";

export type { Product, ProductCategorySlug } from "@/types/product";
export {
  getProductDetailHref,
  getSelectedVariant,
  normalizeProductHandle,
  resolveProductColorId,
  resolveProductVariantId,
} from "@/lib/products/helpers";

/**
 * 商品は Shopify のみをソースとする。
 *
 * 未設定・API エラーは Shopify クライアントが例外を投げるため、
 * 唯一の無言の失敗が「取得は成功したが 0 件」。トークン失効や
 * Headless チャネルからの公開解除で起こり、フォールバックを持たない
 * 以上そのまま配信すると商品が空のサイトが公開されてしまう。
 * ISR 配下では例外時に直前の正常なページが維持される。
 */
async function fetchProductCatalog(): Promise<Product[]> {
  const catalog = await fetchAllProducts();

  if (catalog.length === 0) {
    throw new Error(
      "Shopify から商品を 1 件も取得できませんでした。Storefront API のトークンと、Headless チャネルでの商品公開状態を確認してください。"
    );
  }

  return catalog;
}

export async function getAllProducts(): Promise<Product[]> {
  return fetchProductCatalog();
}

export async function getListingProducts(): Promise<Product[]> {
  return sortProductsForListing(await fetchProductCatalog());
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  return fetchProductByHandle(normalizeProductHandle(handle));
}

export async function getProductsByHandles(handles: string[]): Promise<Product[]> {
  const allProducts = await getAllProducts();

  return handles
    .map((handle) => allProducts.find((product) => product.handle === handle))
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
  const allProducts = await getAllProducts();
  return allProducts.map((product) => product.handle);
}
