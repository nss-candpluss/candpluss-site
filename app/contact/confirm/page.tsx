import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import { ContactConfirm } from "@/sections/contact/ContactConfirm";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `Contact 確認 | ${siteConfig.name}`,
  description: `${siteConfig.name}お問い合わせ内容の確認ページです。`,
};

export default function ContactConfirmPage() {
  return (
    <main
      data-header-theme="onLight"
      className="pt-[var(--product-page-title-top)] pb-[var(--container-y-bottom)]"
    >
      <Container>
        <div className="mx-auto max-w-[980px]">
          <ContactConfirm />
        </div>
      </Container>
    </main>
  );
}
