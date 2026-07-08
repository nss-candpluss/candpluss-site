"use client";

import { ProductDetailActionPanel } from "@/components/products/ProductDetailActionPanel";
import { ProductDetailDescription } from "@/components/products/ProductDetailDescription";
import type { Product, ProductVariant } from "@/types/product";

type ProductDetailInfoProps = {
  product: Product;
  selectedVariant: ProductVariant | null;
  selectedColorCode: string;
  onVariantChange: (variantId: string) => void;
};

export function ProductDetailInfo({
  product,
  selectedVariant,
  selectedColorCode,
  onVariantChange,
}: ProductDetailInfoProps) {
  return (
    <div className="flex flex-col">
      <ProductDetailActionPanel
        product={product}
        selectedVariant={selectedVariant}
        selectedColorCode={selectedColorCode}
        onVariantChange={onVariantChange}
      />

      <ProductDetailDescription
        product={product}
        className="mt-[calc(62px*var(--gap-scale-y))]"
      />
    </div>
  );
}
