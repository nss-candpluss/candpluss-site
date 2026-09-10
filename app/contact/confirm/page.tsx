import { Container } from "@/components/ui/Container";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { fullSpanClassName } from "@/lib/layout";
import { ContactConfirm } from "@/sections/contact/ContactConfirm";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Contact 確認",
  description: `${siteConfig.name}お問い合わせ内容の確認ページです。`,
  path: "/contact/confirm",
  index: false,
});

export default function ContactConfirmPage() {
  return (
    <main
      data-header-theme="onLight"
      className="pt-[var(--product-page-title-top)] pb-[var(--container-y-bottom)]"
    >
      <Container>
        <SiteGrid>
          <div className={`${fullSpanClassName} mx-auto w-full max-w-[980px]`}>
            <ContactConfirm />
          </div>
        </SiteGrid>
      </Container>
    </main>
  );
}
