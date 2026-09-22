import { AccountPageContent } from "@/components/commerce/AccountPageContent";
import { notFoundContent } from "@/data/error-pages";
import { isAccountEnabled } from "@/lib/commerce/account-login";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = isAccountEnabled("public")
  ? createPageMetadata({
      title: "アカウント",
      description: `${siteConfig.name}のアカウントページです。`,
      path: "/account",
      index: false,
    })
  : {
      // 閉鎖中は 404 を返すので、アカウントのタイトルは出さない
      title: notFoundContent.title,
      description: notFoundContent.body.join(" "),
    };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <AccountPageContent searchParams={await searchParams} />;
}
