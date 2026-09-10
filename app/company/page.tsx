import { CompanyDocument } from "@/components/company/CompanyDocument";
import { JsonLd } from "@/components/layout/JsonLd";
import { Container } from "@/components/ui/Container";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { fullSpanClassName } from "@/lib/layout";
import { buildBreadcrumbJsonLd, pageBreadcrumb } from "@/lib/json-ld";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "会社概要",
  description: `${siteConfig.name}の会社概要ページです。`,
  path: "/company",
});

export default function CompanyPage() {
  return (
    <main
      data-header-theme="onLight"
      className="bg-[var(--background)] pt-[var(--product-page-title-top)] pb-[var(--container-y-bottom)]"
    >
      <JsonLd
        data={buildBreadcrumbJsonLd(
          pageBreadcrumb([{ name: "会社概要", path: "/company" }])
        )}
      />
      <Container>
        <SiteGrid>
          <div className={fullSpanClassName}>
            <CompanyDocument />
          </div>
        </SiteGrid>
      </Container>
    </main>
  );
}
