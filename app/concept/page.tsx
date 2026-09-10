import { conceptContent } from "@/data/concept";
import { ConceptPage } from "@/sections/concept/ConceptPage";
import { JsonLd } from "@/components/layout/JsonLd";
import { buildBreadcrumbJsonLd, pageBreadcrumb } from "@/lib/json-ld";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: conceptContent.title,
  description: `${siteConfig.name}のブランドコンセプトページです。`,
  path: "/concept",
});

export default function ConceptRoutePage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd(
          pageBreadcrumb([{ name: conceptContent.title, path: "/concept" }])
        )}
      />
      <main data-header-theme="onDark">
        <ConceptPage />
      </main>
    </>
  );
}
