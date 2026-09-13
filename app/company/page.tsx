import { CompanyDocument } from "@/components/company/CompanyDocument";
import { JsonLd } from "@/components/layout/JsonLd";
import { Container } from "@/components/ui/Container";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { fullSpanClassName } from "@/lib/layout";
import { buildBreadcrumbJsonLd, pageBreadcrumb } from "@/lib/json-ld";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({
  title: "会社概要",
  description:
    "アウトドアブランドC AND+Sを運営する株式会社NSSの会社概要。福岡県大野城市を拠点に、アウトドア製品の開発・製造・販売を行っています。",
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
