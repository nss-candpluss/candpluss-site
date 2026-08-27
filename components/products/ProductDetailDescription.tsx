import type { Product } from "@/types/product";
import { parseProductDescription } from "@/lib/products/description";
import { bodyText, productFeatureItemTitleClassName } from "@/lib/typography";

type ProductDetailDescriptionProps = {
  product: Product;
  className?: string;
  bodyClassName?: string;
};

const descriptionTitleToBodyClassName =
  "mt-[clamp(12px,calc(15px*var(--gap-scale-y)),15px)]";

export function ProductDetailDescription({
  product,
  className = "",
  bodyClassName = `whitespace-pre-line font-body-ja text-[var(--foreground)] ${bodyText(15)}`,
}: ProductDetailDescriptionProps) {
  const { title, body } = parseProductDescription(product.description);

  if (!title && !body) {
    return null;
  }

  return (
    <div className={className}>
      {title ? <p className={productFeatureItemTitleClassName}>{title}</p> : null}
      {body ? (
        <p
          className={`${title ? descriptionTitleToBodyClassName : ""} ${bodyClassName}`.trim()}
        >
          {body}
        </p>
      ) : null}
    </div>
  );
}
