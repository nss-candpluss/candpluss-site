import { JsonLd } from "@/components/layout/JsonLd";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { LicensesDocument } from "@/components/legal/LicensesDocument";
import { licensesContent } from "@/data/legal/licenses";
import { buildBreadcrumbJsonLd, pageBreadcrumb } from "@/lib/json-ld";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: licensesContent.title,
  description: `${siteConfig.name}が利用しているオープンソースソフトウェアのライセンス表記です。`,
  path: "/legal/licenses",
});

export default function LicensesPage() {
  return (
    <LegalPageLayout>
      <JsonLd
        data={buildBreadcrumbJsonLd(
          pageBreadcrumb([{ name: licensesContent.title, path: "/legal/licenses" }])
        )}
      />
      <LicensesDocument />
    </LegalPageLayout>
  );
}
