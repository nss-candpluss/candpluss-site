import { AccountReceiptContent } from "@/components/commerce/AccountReceiptContent";
import { notFoundContent } from "@/data/error-pages";
import { RECEIPT_DOCUMENT_TITLE } from "@/data/receipt";
import { isAccountEnabled } from "@/lib/commerce/account-login";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = isAccountEnabled("public")
  ? createPageMetadata({
      title: RECEIPT_DOCUMENT_TITLE,
      description: `${siteConfig.name}の${RECEIPT_DOCUMENT_TITLE}ページです。`,
      path: "/account/receipt",
      index: false,
    })
  : {
      // 閉鎖中は 404 を返すので、領収書のタイトルは出さない
      title: notFoundContent.title,
      description: notFoundContent.body.join(" "),
    };

type AccountReceiptPageProps = {
  searchParams: Promise<{ order?: string }>;
};

export default async function AccountReceiptPage({
  searchParams,
}: AccountReceiptPageProps) {
  const { order } = await searchParams;

  return <AccountReceiptContent order={order} />;
}
