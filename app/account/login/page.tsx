import { AccountLoginContent } from "@/components/commerce/AccountLoginContent";
import { notFoundContent } from "@/data/error-pages";
import { isAccountEnabled } from "@/lib/commerce/account-login";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = isAccountEnabled("public")
  ? createPageMetadata({
      title: "ログインまたはアカウント作成",
      description: `${siteConfig.name}のログイン・アカウント作成ページです。`,
      path: "/account/login",
      index: false,
    })
  : {
      // 閉鎖中は 404 を返すので、ログインのタイトルは出さない
      title: notFoundContent.title,
      description: notFoundContent.body.join(" "),
    };

type AccountLoginPageProps = {
  searchParams: Promise<{
    returnTo?: string;
    error?: string;
  }>;
};

export default async function AccountLoginPage({
  searchParams,
}: AccountLoginPageProps) {
  const { returnTo, error } = await searchParams;

  return <AccountLoginContent returnTo={returnTo} error={error} />;
}
