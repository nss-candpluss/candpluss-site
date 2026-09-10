import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { fullSpanClassName } from "@/lib/layout";
import { SupportContactThanks } from "@/sections/support/SupportContactThanks";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `お問合せありがとうございます | ${siteConfig.name}`,
  description: `${siteConfig.name}製品保証・修理お問い合わせ完了ページです。`,
};

export default function SupportContactThanksPage() {
  return (
    <main
      data-header-theme="onLight"
      className="pt-[var(--product-page-title-top)] pb-[var(--container-y-bottom)]"
    >
      <Container>
        <SiteGrid>
          <div className={`${fullSpanClassName} mx-auto w-full max-w-[980px]`}>
            <SupportContactThanks />
          </div>
        </SiteGrid>
      </Container>
    </main>
  );
}
