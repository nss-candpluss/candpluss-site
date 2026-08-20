import Link from "next/link";

import { productCategories } from "@/types/product";

type Moya500DesignBreadcrumbsProps = {
  category: string;
  categorySlug: string;
  className?: string;
};

export function Moya500DesignBreadcrumbs({
  category,
  categorySlug,
  className = "",
}: Moya500DesignBreadcrumbsProps) {
  const matchedCategory = productCategories.find(
    (item) => item.slug === categorySlug && item.slug !== "all"
  );

  return (
    <nav aria-label="パンくず" className={className}>
      <ol className="flex items-center">
        <li>
          <Link href="/products#all">全ての商品</Link>
        </li>
        {matchedCategory ? (
          <>
            <li
              aria-hidden="true"
              className="mx-[8px] size-[6px] shrink-0 rotate-45 border-t border-r border-current"
            />
            <li>
              <Link href={`/products#${matchedCategory.slug}`}>
                {category || matchedCategory.label}
              </Link>
            </li>
          </>
        ) : null}
      </ol>
    </nav>
  );
}
