import { Container } from "@/components/ui/Container";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { fullSpanClassName } from "@/lib/layout";
import { SupportContactConfirm } from "@/sections/support/SupportContactConfirm";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "製品保証・修理 確認",
  description: `${siteConfig.name}製品保証・修理お問い合わせ内容の確認ページです。`,
  path: "/support/confirm",
  index: false,
});

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
