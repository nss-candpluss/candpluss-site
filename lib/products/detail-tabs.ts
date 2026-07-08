import type { Product } from "@/types/product";
import { productDetailTabs } from "@/types/product";

export function getVisibleProductDetailTabs(
  product: Product,
  optionProducts: Product[]
) {
  return productDetailTabs.filter((tab) => {
    switch (tab.id) {
      case "photo":
        return true;
      case "feature":
        return Boolean(product.features?.length);
      case "size-spec":
        return Boolean(product.sizeSpec);
      case "options":
        return optionProducts.length > 0;
      default:
        return false;
    }
  });
}
