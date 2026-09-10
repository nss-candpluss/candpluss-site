import { TermsDocument } from "@/components/legal/TermsDocument";
import { JsonLd } from "@/components/layout/JsonLd";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { termsContent } from "@/data/legal/terms";
import { buildBreadcrumbJsonLd, pageBreadcrumb } from "@/lib/json-ld";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: termsContent.title,
  description: `${siteConfig.name}の${termsContent.title}ページです。`,
  path: "/legal/terms",
});

export default function TermsPage() {
  return (
    <LegalPageLayout>
      <JsonLd
        data={buildBreadcrumbJsonLd(
          pageBreadcrumb([{ name: termsContent.title, path: "/legal/terms" }])
        )}
      />
      <TermsDocument />
    </LegalPageLayout>
  );
}
