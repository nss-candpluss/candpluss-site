import "server-only";

import { products } from "@/data/products";
import {
  fetchAllProducts,
  fetchProductByHandle,
} from "@/lib/shopify/products";

import type { Product, ProductCategorySlug } from "@/types/product";
import {
  keepShopifyListingProducts,
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

function usesShopifyProducts() {
  return process.env.PRODUCT_SOURCE === "shopify";
}

function mergeShopifyProducts(shopifyProducts: Product[]) {
  const shopifyByHandle = new Map(
    shopifyProducts.map((product) => [product.handle, product])
  );
  const localHandles = new Set(products.map((product) => product.handle));

  return [
    ...products.map(
      (product) => shopifyByHandle.get(product.handle) ?? product
    ),
    ...shopifyProducts.filter((product) => !localHandles.has(product.handle)),
  ];
}

/**
 * PRODUCT_SOURCE=shopify のときは Shopify を優先し、
 * 詳細などでは未移行のローカル商品も残す。
 */
export async function getAllProducts(): Promise<Product[]> {
  if (!usesShopifyProducts()) {
    return products;
  }

  return mergeShopifyProducts(await fetchAllProducts());
}

export async function getListingProducts(): Promise<Product[]> {
  if (!usesShopifyProducts()) {
    return sortProductsForListing(
      products.filter((product) => !product.listingHidden)
    );
  }

  const shopifyProducts = await fetchAllProducts();
  const shopifyHandles = new Set(
    shopifyProducts.map((product) => product.handle)
  );

  return sortProductsForListing(
    keepShopifyListingProducts(
      mergeShopifyProducts(shopifyProducts),
      shopifyHandles
    )
  );
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  const decodedHandle = normalizeProductHandle(handle);
  const localProduct =
    products.find((product) => product.handle === decodedHandle) ?? null;

  if (!usesShopifyProducts()) {
    return localProduct;
  }

  return (await fetchProductByHandle(decodedHandle)) ?? localProduct;
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
