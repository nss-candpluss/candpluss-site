import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailView } from "@/components/products/product-detail/ProductDetailView";
import { JsonLd } from "@/components/layout/JsonLd";
import { getProductListingImage } from "@/lib/products/gallery";
import { getProductMetaDescription } from "@/lib/products/description";
import {
  getAllProductHandles,
  getProductByHandle,
  getProductsByHandles,
  resolveProductVariantId,
} from "@/lib/products";
import {
  buildBreadcrumbJsonLd,
  buildProductPageJsonLd,
  pageBreadcrumb,
} from "@/lib/json-ld";
import { createPageMetadata } from "@/lib/site-metadata";

type ProductDetailPageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export async function generateStaticParams() {
  const handles = await getAllProductHandles();

  return handles.map((handle) => ({ handle }));
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);

  if (!product) {
    return {};
  }

  return createPageMetadata({
    title: product.title,
    description: getProductMetaDescription(product.description),
    path: `/products/${handle}`,
    image: getProductListingImage(product)?.src,
  });
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);

  if (!product) {
    notFound();
  }

  const initialVariantId = resolveProductVariantId(product);
  const optionHandles =
    product.options?.filter((optionHandle) => optionHandle !== product.handle) ?? [];
  const optionProducts = optionHandles.length
    ? await getProductsByHandles(optionHandles)
    : [];

  return (
    <main
      data-header-theme="onLight"
      className="pb-[var(--container-y-bottom)] min-[1025px]:pt-0"
    >
      <JsonLd
        data={[
          buildProductPageJsonLd(product),
          buildBreadcrumbJsonLd(
            pageBreadcrumb([
              { name: "Products", path: "/products" },
              { name: product.title, path: `/products/${product.handle}` },
            ])
          ),
        ]}
      />
      <ProductDetailView
        product={product}
        initialVariantId={initialVariantId}
        optionProducts={optionProducts}
        priority
      />
    </main>
  );
}
