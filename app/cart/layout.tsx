import { notFound } from "next/navigation";

import { notFoundContent } from "@/data/error-pages";
import { isWebPurchaseEnabled } from "@/lib/commerce/purchase-channel";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

/**
 * 公開ページの購入を止めている間はカートを閉じる。ヘッダーのアイコンを消す
 * だけでは URL 直打ちや履歴から入れてしまい、決済まで進める入口が残る。
 *
 * テスト領域の `/shopify-test/cart` は別ルートなので開いたまま。
 * 10/2 の販売開始では `PUBLIC_WEB_PURCHASE_ENABLED` を true に戻すだけでよい。
 */
const isPublicCartOpen = isWebPurchaseEnabled("public");

export const metadata = isPublicCartOpen
  ? createPageMetadata({
      title: "カート",
      description: `${siteConfig.name}のカートページです。`,
      path: "/cart",
      index: false,
    })
  : {
      // 閉鎖中は 404 を返すので、カートのタイトルは出さない
      title: notFoundContent.title,
      description: notFoundContent.body.join(" "),
    };

export default function CartLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!isPublicCartOpen) {
    notFound();
  }

  return children;
}
