import { Container } from "@/components/ui/Container";
import { ProductsListing } from "@/components/products/ProductsListing";
import { getListingProducts } from "@/lib/products";
import { createPageMetadata } from "@/lib/site-metadata";
import { sectionTitle62ClassName } from "@/lib/typography";

/**
 * 公開ページの `/products` と同じ構成にする。違いは次の 2 点だけ。
 * - 構造化データを出さない（検索対象にしない領域なので不要）
 * - noindex を返す
 */
export const metadata = createPageMetadata({
  title: "Products（Shopify 購入テスト）",
  description: "Shopify の購入テスト用の商品一覧です。",
  path: "/shopify-test/products",
  index: false,
});

export default async function ShopifyTestProductsPage() {
  const products = await getListingProducts();

  return (
    <main
      data-header-theme="onLight"
      className="pt-[var(--product-page-title-top)] pb-[var(--container-y-bottom)]"
    >
      <Container>
        <h1 className={`font-heading text-[var(--foreground)] ${sectionTitle62ClassName}`}>Products</h1>
        <ProductsListing products={products} />
      </Container>
    </main>
  );
}
