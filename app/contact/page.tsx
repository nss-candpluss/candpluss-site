import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { fullSpanClassName } from "@/lib/layout";
import { ContactForm } from "@/sections/contact/ContactForm";
import { ContactHero } from "@/sections/contact/ContactHero";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `Contact | ${siteConfig.name}`,
  description: `${siteConfig.name}へのお問い合わせページです。`,
};

export default function ContactPage() {
  return (
    <main
      data-header-theme="onLight"
      className="pt-[var(--product-page-title-top)] pb-[var(--container-y-bottom)]"
    >
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
