"use client";

import { useLayoutEffect, useMemo, useState } from "react";

import { ProductCard } from "@/components/products/ProductCard";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { productCategories } from "@/types/product";
import type { Product, ProductCategorySlug } from "@/types/product";
import { HoverUnderlineText } from "@/components/ui/TextLink";
import { productCardSpanClassName } from "@/lib/layout";
import { uiText } from "@/lib/typography";

type ProductsListingProps = {
  products: Product[];
};

/**
 * URL のハッシュから表示するカテゴリを決める。
 *
 * 戻るでハッシュが消えた場合や、知らないハッシュが付いていた場合は
 * 「全ての商品」に戻す。
 */
function categoryFromHash(hash: string): ProductCategorySlug {
  const categorySlug = hash.startsWith("#") ? hash.slice(1) : hash;
  const matched = productCategories.find(
    (category) => category.slug === categorySlug
  );

  return matched?.slug ?? "all";
}

export function ProductsListing({ products }: ProductsListingProps) {
  const [activeCategory, setActiveCategory] = useState<ProductCategorySlug>("all");

  // サーバーはハッシュを知らないので「全ての商品」で描画される。
  // 描画直後に同期して、絞り込み前の一覧が見えないようにする。
  useLayoutEffect(() => {
    const syncCategoryFromHash = () => {
      setActiveCategory(categoryFromHash(window.location.hash));
    };

    syncCategoryFromHash();

    // hashchange はハッシュが変わったとき、popstate は戻る・進むのとき。
    // ハッシュなしの履歴どうしを行き来する場合は popstate しか発火しない。
    window.addEventListener("hashchange", syncCategoryFromHash);
    window.addEventListener("popstate", syncCategoryFromHash);

    return () => {
      window.removeEventListener("hashchange", syncCategoryFromHash);
      window.removeEventListener("popstate", syncCategoryFromHash);
    };
  }, []);

  const handleCategorySelect = (categorySlug: ProductCategorySlug) => {
    if (categorySlug === activeCategory) {
      return;
    }

    setActiveCategory(categorySlug);
    // 履歴を積んで、戻るで前のカテゴリに戻れるようにする。
    window.history.pushState(
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
        <ul className="flex w-max min-w-full gap-x-[clamp(16px,calc(38px*var(--gap-scale-x)),38px)] gap-y-[calc(32px*var(--gap-scale-y))] pb-[calc(4/14*1em+1px)] text-[clamp(15px,calc(16px*var(--text-scale)),16px)] min-[1025px]:flex-wrap">
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
