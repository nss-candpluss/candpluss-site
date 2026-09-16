import { AccountPageContent } from "@/components/commerce/AccountPageContent";
import { ACCOUNT_BASE_PATH } from "@/lib/commerce/account-login";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "アカウント（Shopify 購入テスト）",
  description: `${siteConfig.name}の Shopify 購入テスト用のアカウントページです。`,
  path: ACCOUNT_BASE_PATH,
  index: false,
});

export default function ShopifyTestAccountPage() {
  return <AccountPageContent />;
}
