import { JsonLd } from "@/components/layout/JsonLd";
import { Container } from "@/components/ui/Container";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { fullSpanClassName } from "@/lib/layout";
import { ContactForm } from "@/sections/contact/ContactForm";
import { ContactHero } from "@/sections/contact/ContactHero";
import { buildBreadcrumbJsonLd, pageBreadcrumb } from "@/lib/json-ld";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Contact",
  description: `${siteConfig.name}へのお問い合わせページです。`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <main
      data-header-theme="onLight"
      className="pt-[var(--product-page-title-top)] pb-[var(--container-y-bottom)]"
    >
      <JsonLd
        data={buildBreadcrumbJsonLd(
          pageBreadcrumb([{ name: "Contact", path: "/contact" }])
        )}
      />
      <Container>
        <SiteGrid>
          <div className={`${fullSpanClassName} mx-auto w-full max-w-[980px]`}>
            <ContactHero />
            <ContactForm />
          </div>
        </SiteGrid>
      </Container>
    </main>
  );
}
