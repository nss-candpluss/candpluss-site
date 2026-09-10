import { ShoppingGuideDocument } from "@/components/shopping-guide/ShoppingGuideDocument";
import { JsonLd } from "@/components/layout/JsonLd";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { shoppingGuideContent } from "@/data/shoppingGuide";
import { buildBreadcrumbJsonLd, pageBreadcrumb } from "@/lib/json-ld";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: shoppingGuideContent.title,
  description: `${siteConfig.name}の${shoppingGuideContent.title}ページです。`,
  path: "/shopping-guide",
});

export default function ShoppingGuidePage() {
  return (
    <LegalPageLayout>
      <JsonLd
        data={buildBreadcrumbJsonLd(
          pageBreadcrumb([
            { name: shoppingGuideContent.title, path: "/shopping-guide" },
          ])
        )}
      />
      <ShoppingGuideDocument />
    </LegalPageLayout>
  );
}
