import type { ProductFeature } from "@/types/product";
import { resolveFeatureImageSrc } from "@/lib/products/image-paths";
import { productDetailSectionTitleClassName } from "@/lib/typography";

import { ProductFeatureCard } from "./ProductFeatureCard";

type ProductFeaturesProps = {
  features: ProductFeature[];
  productHandle: string;
  colorCode?: string;
  colorKeyedFeatureImages?: boolean;
};

export function ProductFeatures({
  features,
  productHandle,
  colorCode,
  colorKeyedFeatureImages = false,
}: ProductFeaturesProps) {
  if (!features.length) {
    return null;
  }

  return (
    <section
      id="feature"
      className="scroll-mt-[var(--header-height)] px-[var(--container-x)] pt-[var(--container-y-top)] pb-[var(--container-y-bottom)]"
    >
      <h2 className={`font-heading text-[var(--foreground)] ${productDetailSectionTitleClassName}`}>Feature</h2>

      <div className="mt-[calc(98px*var(--gap-scale-y))] grid grid-cols-1 gap-x-[calc(52px*var(--gap-scale-x))] gap-y-[calc(62px*var(--gap-scale-y))] md:grid-cols-2">
        {features.map((feature, index) => (
          <ProductFeatureCard
            key={feature.id}
            feature={{
              ...feature,
              image: resolveFeatureImageSrc(feature, {
                handle: productHandle,
                colorCode,
                colorKeyed: colorKeyedFeatureImages,
              }),
            }}
            priority={index === 0}
          />
        ))}
      </div>
    </section>
  );
}
