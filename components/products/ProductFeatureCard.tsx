import { ProductFeatureLinks } from "@/components/products/ProductFeatureLinks";
import { ProductNotes } from "@/components/products/ProductNotes";
import { SiteImage } from "@/components/ui/SiteImage";

import type { ProductFeature } from "@/types/product";
import { splitFeatureNotes } from "@/lib/products/feature-notes";
import { uiText } from "@/lib/typography";

type ProductFeatureCardProps = {
  feature: ProductFeature;
  sizes?: string;
  priority?: boolean;
};

export function ProductFeatureCard({
  feature,
  sizes = "(min-width: 768px) 33vw, 100vw",
  priority = false,
}: ProductFeatureCardProps) {
  const { body, notes } = splitFeatureNotes(feature.body);

  return (
    <article className="block">
      {feature.image ? (
        <div className="relative aspect-[13/10] overflow-hidden bg-[var(--color-line)]">
          <SiteImage
            src={feature.image}
            alt=""
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover object-center"
          />
        </div>
      ) : null}

      <div className="mt-[calc(28px*var(--gap-scale-y))] flex flex-col px-[calc(8px*var(--gap-scale-x))] min-[1024px]:mt-[calc(22px*var(--gap-scale-y))]">
        <h3
          className={`min-w-0 font-body-ja font-bold text-[var(--foreground)] ${uiText(16)}`}
        >
          {feature.title}
        </h3>

        {body ? (
          <p
            className="mt-[calc(15px*var(--gap-scale-y))] whitespace-pre-line font-body-ja text-[calc(15px*var(--text-scale))] leading-[calc(23px*var(--text-scale))] text-[var(--foreground)]"
          >
            {body}
          </p>
        ) : null}

        <ProductNotes
          notes={notes}
          listClassName="mt-[calc(18px*var(--gap-scale-y))]"
        />

        {feature.links?.length ? <ProductFeatureLinks links={feature.links} /> : null}
      </div>
    </article>
  );
}
