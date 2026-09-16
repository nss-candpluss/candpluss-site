import { AccountLoginContent } from "@/components/commerce/AccountLoginContent";
import { ACCOUNT_LOGIN_PATH } from "@/lib/commerce/account-login";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "ログインまたはアカウント作成（Shopify 購入テスト）",
  description: `${siteConfig.name}の Shopify 購入テスト用のログイン・アカウント作成ページです。`,
  path: ACCOUNT_LOGIN_PATH,
  index: false,
});

type ShopifyTestAccountLoginPageProps = {
  searchParams: Promise<{
    returnTo?: string;
    error?: string;
  }>;
};

export default async function ShopifyTestAccountLoginPage({
  searchParams,
}: ShopifyTestAccountLoginPageProps) {
  const { returnTo, error } = await searchParams;

  return <AccountLoginContent returnTo={returnTo} error={error} />;
}
