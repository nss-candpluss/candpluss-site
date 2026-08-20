import type { Product } from "@/types/product";

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
