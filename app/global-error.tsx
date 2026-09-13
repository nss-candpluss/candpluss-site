"use client";

import { globalErrorContent } from "@/data/error-pages";
import { siteConfig } from "@/lib/site";
import "./globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/**
 * ルートレイアウトごと失敗したときのみ描画される。
 * layout.tsx を置き換えるため html / body と globals.css を自前で持ち、
 * next/font は読み込まれないので globals.css のフォールバックフォントで組む。
 */
export default function GlobalError({ retry }: GlobalErrorProps) {
  return (
    <html lang="ja">
      <title>{`${globalErrorContent.title} | ${siteConfig.name}`}</title>
      <body className="bg-[var(--background)] text-[var(--foreground)]">
        <main className="mx-auto flex min-h-screen max-w-[720px] flex-col justify-center px-6 py-16">
          <h1 className="font-body-ja text-[24px] leading-[24px] font-semibold">
            {globalErrorContent.title}
          </h1>

          <p className="mt-[32px] font-body-ja text-[15px] leading-[26.25px]">
            {globalErrorContent.body}
          </p>

          <button
            type="button"
            onClick={() => retry()}
            className="mt-[60px] self-start cursor-pointer font-ui-en text-[18px] leading-[18px] font-medium underline underline-offset-4"
          >
            {globalErrorContent.retryLabel}
          </button>
        </main>
      </body>
    </html>
  );
}
