import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductDetailView } from "@/components/products/ProductDetailView";
import {
  getAllProductHandles,
  getProductByHandle,
  getProductsByHandles,
  resolveProductVariantId,
} from "@/lib/products";

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

  return {
    title: product.title,
    description: product.description,
  };
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
      className="pb-[var(--container-y-bottom)] min-[1024px]:pt-0"
    >
      <Suspense fallback={null}>
        <ProductDetailView
          product={product}
          initialVariantId={initialVariantId}
          optionProducts={optionProducts}
          priority
        />
      </Suspense>
    </main>
  );
}
