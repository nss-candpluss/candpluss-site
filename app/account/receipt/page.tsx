import { AccountReceiptContent } from "@/components/commerce/AccountReceiptContent";
import { notFoundContent } from "@/data/error-pages";
import { isAccountEnabled } from "@/lib/commerce/account-login";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = isAccountEnabled("public")
  ? createPageMetadata({
      title: "領収書",
      description: `${siteConfig.name}の領収書ページです。`,
      path: "/account/receipt",
      index: false,
    })
  : {
      // 閉鎖中は 404 を返すので、領収書のタイトルは出さない
      title: notFoundContent.title,
      description: notFoundContent.body.join(" "),
    };

type AccountReceiptPageProps = {
  searchParams: Promise<{
    order?: string;
    to?: string;
    note?: string;
  }>;
};

export default async function AccountReceiptPage({
  searchParams,
}: AccountReceiptPageProps) {
  const { order, to, note } = await searchParams;

  return <AccountReceiptContent order={order} to={to} note={note} />;
}
