import type { Product } from "@/types/product";
import { bodyText } from "@/lib/typography";

type ProductDetailDescriptionProps = {
  product: Product;
  className?: string;
};

export function ProductDetailDescription({
  product,
  className = "",
}: ProductDetailDescriptionProps) {
  return (
    <p
      className={`whitespace-pre-line font-body-ja text-[var(--foreground)] ${bodyText(15)} ${className}`.trim()}
    >
      {product.description.replace(/\n{2,}/g, "\n")}
    </p>
  );
}
