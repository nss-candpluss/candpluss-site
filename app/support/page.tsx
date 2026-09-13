import { supportContent } from "@/data/support";
import { SupportPage } from "@/sections/support/SupportPage";
import { JsonLd } from "@/components/layout/JsonLd";
import { buildBreadcrumbJsonLd, pageBreadcrumb } from "@/lib/json-ld";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({
  title: supportContent.title,
  description:
    "C AND+S製品の保証と修理について。保証の範囲や期間、修理をご依頼いただく際の流れとお問い合わせ方法をご案内します。",
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
