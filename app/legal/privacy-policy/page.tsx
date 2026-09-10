import { JsonLd } from "@/components/layout/JsonLd";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { PrivacyPolicyDocument } from "@/components/legal/PrivacyPolicyDocument";
import { privacyPolicyContent } from "@/data/legal/privacyPolicy";
import { buildBreadcrumbJsonLd, pageBreadcrumb } from "@/lib/json-ld";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: privacyPolicyContent.title,
  description: `${siteConfig.name}の${privacyPolicyContent.title}ページです。`,
  path: "/legal/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout>
      <JsonLd
        data={buildBreadcrumbJsonLd(
          pageBreadcrumb([
            { name: privacyPolicyContent.title, path: "/legal/privacy-policy" },
          ])
        )}
      />
      <PrivacyPolicyDocument />
    </LegalPageLayout>
  );
}
