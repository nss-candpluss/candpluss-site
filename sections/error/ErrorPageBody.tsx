import type { ReactNode } from "react";

import { Container } from "@/components/ui/Container";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { fullSpanClassName } from "@/lib/layout";
import { bodyText, uiText } from "@/lib/typography";

type ErrorPageBodyProps = {
  /** 404 のみ表示する数字。エラーページでは省略する */
  code?: string;
  title: string;
  body: readonly string[];
  /** リンクや再読み込みボタン */
  actions: ReactNode;
};

/** 404 とエラーページで共有する本文レイアウト */
export function ErrorPageBody({ code, title, body, actions }: ErrorPageBodyProps) {
  return (
    <main
      data-header-theme="onLight"
      className="pt-[var(--product-page-title-top)] pb-[var(--container-y-bottom)]"
    >
      <Container>
        <SiteGrid>
          <div className={`${fullSpanClassName} mx-auto w-full max-w-[720px]`}>
            {code ? (
              <p
                className={`font-heading text-[var(--color-muted)] ${uiText(62)}`}
              >
                {code}
              </p>
            ) : null}

            <h1
              className={`font-body-ja font-semibold text-[var(--foreground)] ${uiText(24)} ${
                code ? "mt-[calc(24px*var(--gap-scale-y))]" : ""
              }`}
            >
              {title}
            </h1>

            <p
              className={`mt-[calc(32px*var(--gap-scale-y))] font-body-ja text-[var(--foreground)] ${bodyText(15)}`}
            >
              {body.map((line, index) => (
                <span key={line}>
                  {index > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </p>

            <div className="mt-[calc(60px*var(--gap-scale-y))] flex flex-col items-start gap-[calc(24px*var(--gap-scale-y))]">
              {actions}
            </div>
          </div>
        </SiteGrid>
      </Container>
    </main>
  );
}
