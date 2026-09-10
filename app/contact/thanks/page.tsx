import { Container } from "@/components/ui/Container";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { fullSpanClassName } from "@/lib/layout";
import { ContactThanks } from "@/sections/contact/ContactThanks";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "お問合せありがとうございます",
  description: `${siteConfig.name}お問い合わせ完了ページです。`,
  path: "/contact/thanks",
  index: false,
});

export default function ContactThanksPage() {
  return (
    <main
      data-header-theme="onLight"
      className="pt-[var(--product-page-title-top)] pb-[var(--container-y-bottom)]"
    >
      <Container>
        <SiteGrid>
          <div className={`${fullSpanClassName} mx-auto w-full max-w-[980px]`}>
            <ContactThanks />
          </div>
        </SiteGrid>
      </Container>
    </main>
  );
}
