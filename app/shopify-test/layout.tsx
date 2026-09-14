import type { Metadata } from "next";

/**
 * Shopify の購入テスト用の領域。
 *
 * Basic 認証（`proxy.ts`）と robots の Disallow を掛けた上で、noindex も返す。
 * 認証が外れた場合でも検索結果に出ないようにするため三重で掛けている。
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function ShopifyTestLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      {/*
        公開ページと見た目を揃えているため、テスト領域だと分かる目印を出す。
        レイアウトに影響しないよう固定表示にし、カートのダイアログ（z-70）
        より下に置く。
      */}
      <p className="pointer-events-none fixed bottom-0 left-0 z-[60] bg-[#c40000] px-[10px] py-[6px] font-body-ja text-[11px] leading-none text-white">
        Shopify 購入テスト用
      </p>
    </>
  );
}
