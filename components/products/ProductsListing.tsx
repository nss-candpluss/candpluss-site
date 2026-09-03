"use client";

import { useEffect, useMemo, useState } from "react";

import { ProductCard } from "@/components/products/ProductCard";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { productCategories } from "@/data/products";
import type { Product, ProductCategorySlug } from "@/data/products";
import { HoverUnderlineText } from "@/components/ui/TextLink";
import { productCardSpanClassName } from "@/lib/layout";
import { uiText } from "@/lib/typography";

type ProductsListingProps = {
  products: Product[];
};

export function ProductsListing({ products }: ProductsListingProps) {
  const [activeCategory, setActiveCategory] = useState<ProductCategorySlug>("all");

  useEffect(() => {
    const syncCategoryFromHash = () => {
      const categorySlug = window.location.hash.slice(1);
      const categoryExists = productCategories.some(
        (category) => category.slug === categorySlug
      );

      if (categoryExists) {
        setActiveCategory(categorySlug as ProductCategorySlug);
      }
    };
    const timeoutId = window.setTimeout(syncCategoryFromHash, 0);

    window.addEventListener("hashchange", syncCategoryFromHash);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("hashchange", syncCategoryFromHash);
    };
  }, []);

  const handleCategorySelect = (categorySlug: ProductCategorySlug) => {
    setActiveCategory(categorySlug);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}#${categorySlug}`
    );
  };

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
        <ul className="flex w-max min-w-full gap-x-[clamp(16px,calc(38px*var(--gap-scale-x)),38px)] gap-y-[calc(32px*var(--gap-scale-y))] pb-[calc(4/14*1em+1px)] text-[calc(16px*var(--text-scale))] min-[1024px]:flex-wrap">
          {productCategories.map((category) => {
            const isActive = category.slug === activeCategory;

            return (
              <li key={category.slug}>
                <button
                  id={category.slug}
                  type="button"
                  onClick={() => handleCategorySelect(category.slug)}
                  aria-current={isActive ? "true" : undefined}
                  className={`scroll-mt-[var(--header-height)] shrink-0 transition-colors duration-300 ${
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

      <SiteGrid className="mt-[calc(52px*var(--gap-scale-y))] gap-x-[calc(16px*var(--gap-scale-x))] gap-y-[calc(62px*var(--gap-scale-y))]">
        {filteredProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            className={productCardSpanClassName}
            priority={index < 3}
            presentation="productsListing"
          />
        ))}
      </SiteGrid>
    </>
  );
}
