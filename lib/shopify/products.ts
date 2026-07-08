import type { Product } from "@/types/product";

/**
 * 将来の Shopify Storefront API 連携用。
 * Shopify Product → C AND+S Product 型へ変換する責務を持つ。
 */
export async function fetchProductByHandle(handle: string): Promise<Product | null> {
  void handle;
  throw new Error("Shopify integration is not implemented yet.");
}

export async function fetchAllProducts(): Promise<Product[]> {
  throw new Error("Shopify integration is not implemented yet.");
}
