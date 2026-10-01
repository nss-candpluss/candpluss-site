import { AccountReceiptContent } from "@/components/commerce/AccountReceiptContent";
import { ACCOUNT_RECEIPT_PATH } from "@/lib/commerce/account-login";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "領収書（Shopify 購入テスト）",
  description: `${siteConfig.name}の Shopify 購入テスト用の領収書ページです。`,
  path: ACCOUNT_RECEIPT_PATH,
  index: false,
});

type ShopifyTestAccountReceiptPageProps = {
  searchParams: Promise<{ order?: string }>;
};

export default async function ShopifyTestAccountReceiptPage({
  searchParams,
}: ShopifyTestAccountReceiptPageProps) {
  const { order } = await searchParams;

  return <AccountReceiptContent order={order} />;
}
