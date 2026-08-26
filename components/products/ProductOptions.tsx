import { ProductCard } from "@/components/products/ProductCard";
import type { Product } from "@/types/product";
import { productDetailSectionTitleClassName } from "@/lib/typography";

type ProductOptionsProps = {
  products: Product[];
  titleTypographyClassName?: string;
  cardPresentation?: "default" | "productsListing";
};

export function ProductOptions({
  products,
  titleTypographyClassName = productDetailSectionTitleClassName,
  cardPresentation = "default",
}: ProductOptionsProps) {
  if (!products.length) {
    return null;
  }

  return (
    <section
      id="options"
      className="scroll-mt-[var(--header-height)] px-[var(--container-x)] pt-[var(--container-y-top)] pb-[var(--container-y-bottom)]"
    >
      <h2 className={`font-heading text-[var(--foreground)] ${titleTypographyClassName}`}>
        Options
      </h2>

      <div className="mt-[calc(98px*var(--gap-scale-y))] grid grid-cols-1 gap-x-[calc(16px*var(--gap-scale-x))] gap-y-[calc(46px*var(--gap-scale-y))] min-[640px]:grid-cols-2 min-[1024px]:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            presentation={cardPresentation}
          />
        ))}
      </div>
    </section>
  );
}
