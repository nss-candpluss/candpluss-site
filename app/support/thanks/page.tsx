import { Container } from "@/components/ui/Container";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { fullSpanClassName } from "@/lib/layout";
import { SupportContactThanks } from "@/sections/support/SupportContactThanks";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "初期不良・修理 送信完了",
  description: `${siteConfig.name}の初期不良・修理に関するお問い合わせ送信完了ページです。`,
  path: "/support/thanks",
  index: false,
});

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
