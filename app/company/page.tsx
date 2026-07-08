import type { Metadata } from "next";

import { CompanyDocument } from "@/components/company/CompanyDocument";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `会社概要 | ${siteConfig.name}`,
  description: `${siteConfig.name}の会社概要ページです。`,
};

export default function CompanyPage() {
  return (
    <main
      data-header-theme="onLight"
      className="pt-[var(--product-page-title-top)] pb-[var(--container-y-bottom)]"
    >
      <Container>
        <CompanyDocument />
      </Container>
    </main>
  );
}
