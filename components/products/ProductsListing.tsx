"use client";

import { useMemo, useState } from "react";

import { ProductCard } from "@/components/products/ProductCard";
import { productCategories } from "@/data/products";
import type { Product, ProductCategorySlug } from "@/data/products";
import { HoverUnderlineText } from "@/components/ui/TextLink";
import { uiText } from "@/lib/typography";

type ProductsListingProps = {
  products: Product[];
};

export function ProductsListing({ products }: ProductsListingProps) {
  const [activeCategory, setActiveCategory] = useState<ProductCategorySlug>("all");

  const filteredProducts = useMemo(() => {
    if (activeCategory === "all") {
      return products;
    }

    return products.filter((product) => product.categorySlug === activeCategory);
  }, [activeCategory, products]);

  return (
    <>
      <nav
        aria-label="Product categories"
        className="-mx-[var(--container-x)] mt-[calc(98px*var(--layout-scale-y))] overflow-x-auto px-[var(--container-x)]"
      >
        <ul className="flex w-max min-w-full gap-x-[calc(32px*var(--gap-scale-x))] gap-y-[calc(32px*var(--gap-scale-y))] pb-[calc(4/14*1em+1px)] text-[calc(16px*var(--text-scale))] min-[1024px]:flex-wrap">
          {productCategories.map((category) => {
            const isActive = category.slug === activeCategory;

            return (
              <li key={category.slug}>
                <button
                  type="button"
                  onClick={() => setActiveCategory(category.slug)}
                  aria-current={isActive ? "true" : undefined}
                  className={`shrink-0 transition-colors duration-300 ${
                    isActive
                      ? "text-[var(--foreground)]"
                      : "text-[var(--color-muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <HoverUnderlineText
                    variant={isActive ? "active" : "hover"}
                    className={`font-body-ja ${uiText(16)}`}
                  >
                    {category.label}
                  </HoverUnderlineText>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-[calc(52px*var(--gap-scale-y))] grid grid-cols-1 gap-x-[calc(16px*var(--gap-scale-x))] gap-y-[calc(62px*var(--gap-scale-y))] min-[640px]:grid-cols-2 min-[1024px]:grid-cols-3">
        {filteredProducts.map((product, index) => (
          <ProductCard key={product.id} product={product} priority={index < 3} />
        ))}
      </div>
    </>
  );
}
