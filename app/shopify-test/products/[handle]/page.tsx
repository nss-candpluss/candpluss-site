import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailView } from "@/components/products/product-detail/ProductDetailView";
import { getProductOgImage } from "@/lib/products/gallery";
import { getProductMetaDescription } from "@/lib/products/description";
import {
  getProductByHandle,
  getProductsByHandles,
  resolveProductVariantId,
} from "@/lib/products";
import { createPageMetadata } from "@/lib/site-metadata";

type ShopifyTestProductDetailPageProps = {
  params: Promise<{
    handle: string;
  }>;
};

/**
 * 公開ページの `/products/[handle]` と同じ構成にする。違いは次の 3 点だけ。
 * - 構造化データを出さない（検索対象にしない領域なので不要）
 * - noindex を返す
 * - `generateStaticParams` を持たない。テスト領域を事前生成すると商品数の分
 *   だけビルドが伸びる上、Shopify 側の変更を都度反映したいのでリクエスト時に
 *   取得する
 */
export async function generateMetadata({
  params,
}: ShopifyTestProductDetailPageProps): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);

  if (!product) {
    return {};
  }

  return createPageMetadata({
    title: `${product.title}（Shopify 購入テスト）`,
    description: getProductMetaDescription(product.description),
    path: `/shopify-test/products/${handle}`,
    image: getProductOgImage(product),
    index: false,
  });
}

export default async function ShopifyTestProductDetailPage({
  params,
}: ShopifyTestProductDetailPageProps) {
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
      <ProductDetailView
        product={product}
        initialVariantId={initialVariantId}
        optionProducts={optionProducts}
        priority
      />
    </main>
  );
}
