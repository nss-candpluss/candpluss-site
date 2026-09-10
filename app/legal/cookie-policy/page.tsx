import { CookiePolicyDocument } from "@/components/legal/CookiePolicyDocument";
import { JsonLd } from "@/components/layout/JsonLd";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { cookiePolicyContent } from "@/data/legal/cookiePolicy";
import { buildBreadcrumbJsonLd, pageBreadcrumb } from "@/lib/json-ld";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: cookiePolicyContent.title,
  description: `${siteConfig.name}の${cookiePolicyContent.title}ページです。`,
  path: "/legal/cookie-policy",
});

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout>
      <JsonLd
        data={buildBreadcrumbJsonLd(
          pageBreadcrumb([
            { name: cookiePolicyContent.title, path: "/legal/cookie-policy" },
          ])
        )}
      />
      <CookiePolicyDocument />
    </LegalPageLayout>
  );
}
