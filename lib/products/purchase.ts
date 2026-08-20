import type { Product } from "@/types/product";

const NON_PURCHASABLE_STATUSES = new Set<Product["status"]>([
  "new",
  "comingSoon",
  "waiting",
  "ended",
  "soldOut",
  "discontinued",
]);

export function canPurchaseProduct(
  product: Product,
  isAuthenticated: boolean
) {
  const isShopifyProduct = product.variants.some(
    (variant) => variant.shopifyVariantId
  );
  if (isShopifyProduct && product.memberAccessConfigured === false) {
    return false;
  }

  if (NON_PURCHASABLE_STATUSES.has(product.status)) {
    return false;
  }

  return product.memberAccess !== "memberOnly" || isAuthenticated;
}
