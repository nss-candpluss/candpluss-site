import { CartPageContent } from "@/components/commerce/CartPageContent";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "カート（Shopify 購入テスト）",
  description: `${siteConfig.name}の Shopify 購入テスト用のカートページです。`,
  path: "/shopify-test/cart",
  index: false,
});

export default function ShopifyTestCartPage() {
  return <CartPageContent />;
}
