import type { Metadata } from "next";

import { Moya500DesignDetailView } from "@/components/products/moya500-design/Moya500DesignDetailView";
import { moya500DesignProduct } from "@/data/products/moya500-design";
import { getProductMetaDescription } from "@/lib/products/description";
import { getProductsByHandles, resolveProductVariantId } from "@/lib/products";

export const metadata: Metadata = {
  title: moya500DesignProduct.title,
  description: getProductMetaDescription(moya500DesignProduct.description),
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Moya500DesignProductPage() {
  const product = moya500DesignProduct;
  const initialVariantId = resolveProductVariantId(product);
  const optionHandles =
    product.options?.filter((optionHandle) => optionHandle !== product.handle) ?? [];
  const optionProducts = optionHandles.length
    ? await getProductsByHandles(optionHandles)
    : [];

  return (
    <main
      data-header-theme="onLight"
      className="pb-[var(--container-y-bottom)] min-[1024px]:pt-0"
    >
      <Moya500DesignDetailView
        product={product}
        initialVariantId={initialVariantId}
        optionProducts={optionProducts}
        priority
      />
    </main>
  );
}
