import type { Metadata } from "next";

/**
 * 先方確認用のプレビュー領域。認証は掛けず、URL を知っている人だけが見る前提。
 *
 * robots の Disallow と noindex を二重で掛け、検索結果に出ないようにする。
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

export default function PreviewLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      {/* カートのダイアログ（z-70）より下に置く */}
      <p className="pointer-events-none fixed bottom-0 left-0 z-[60] bg-[#c40000] px-[10px] py-[6px] font-body-ja text-[11px] leading-none text-white">
        確認用プレビュー
      </p>
    </>
  );
}
