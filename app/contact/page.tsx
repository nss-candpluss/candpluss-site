import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
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
        <div className="mx-auto max-w-[980px]">
          <ContactHero />
          <ContactForm />
        </div>
      </Container>
    </main>
  );
}
