import { conceptContent } from "@/data/concept";
import { ConceptPage } from "@/sections/concept/ConceptPage";
import { JsonLd } from "@/components/layout/JsonLd";
import { buildBreadcrumbJsonLd, pageBreadcrumb } from "@/lib/json-ld";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({
  title: conceptContent.title,
  description:
    "キャンプと、大切なものをつなぐ。C AND+Sは、道具と空間を通して、人それぞれの大切な“Something”とキャンプをつなぎます。自然の中で過ごす時間を、もっと心地よく、美しく、自由に。What’s Your + S ?",
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
