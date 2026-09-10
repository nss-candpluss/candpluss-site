import { supportContent } from "@/data/support";
import { SupportPage } from "@/sections/support/SupportPage";
import { JsonLd } from "@/components/layout/JsonLd";
import { buildBreadcrumbJsonLd, pageBreadcrumb } from "@/lib/json-ld";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: supportContent.title,
  description: `${siteConfig.name}の製品保証・修理について紹介するページです。`,
  path: "/support",
});

export default function SupportRoutePage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd(
          pageBreadcrumb([{ name: supportContent.title, path: "/support" }])
        )}
      />
      <main data-header-theme="onDark">
        <SupportPage />
      </main>
    </>
  );
}
