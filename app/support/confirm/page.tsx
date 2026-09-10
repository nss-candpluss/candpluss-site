import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { fullSpanClassName } from "@/lib/layout";
import { SupportContactConfirm } from "@/sections/support/SupportContactConfirm";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `製品保証・修理 確認 | ${siteConfig.name}`,
  description: `${siteConfig.name}製品保証・修理お問い合わせ内容の確認ページです。`,
};

export default function SupportContactConfirmPage() {
  return (
    <main
      data-header-theme="onLight"
      className="pt-[var(--product-page-title-top)] pb-[var(--container-y-bottom)]"
    >
      <Container>
        <SiteGrid>
          <div className={`${fullSpanClassName} mx-auto w-full max-w-[980px]`}>
            <SupportContactConfirm />
          </div>
        </SiteGrid>
      </Container>
    </main>
  );
}
