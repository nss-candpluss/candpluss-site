import { laboContent } from "@/data/labo";
import { LaboPage } from "@/sections/labo/LaboPage";
import { JsonLd } from "@/components/layout/JsonLd";
import { buildBreadcrumbJsonLd, pageBreadcrumb } from "@/lib/json-ld";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: laboContent.title,
  description: `${siteConfig.name} LABOは、製品を実際に見て、触れて、品質やサイズ感を確かめられるブランド体験スペースです。`,
  path: "/labo",
});

export default function LaboRoutePage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd(
          pageBreadcrumb([{ name: laboContent.title, path: "/labo" }])
        )}
      />
      <main data-header-theme="onDark">
        <LaboPage />
      </main>
    </>
  );
}
