import { CommercialTransactionsDocument } from "@/components/legal/CommercialTransactionsDocument";
import { JsonLd } from "@/components/layout/JsonLd";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { commercialTransactionsContent } from "@/data/legal/commercialTransactions";
import { buildBreadcrumbJsonLd, pageBreadcrumb } from "@/lib/json-ld";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: commercialTransactionsContent.title,
  description: `${siteConfig.name}の${commercialTransactionsContent.title}ページです。`,
  path: "/legal/commercial-transactions",
});

export default function CommercialTransactionsPage() {
  return (
    <LegalPageLayout>
      <JsonLd
        data={buildBreadcrumbJsonLd(
          pageBreadcrumb([
            {
              name: commercialTransactionsContent.title,
              path: "/legal/commercial-transactions",
            },
          ])
        )}
      />
      <CommercialTransactionsDocument />
    </LegalPageLayout>
  );
}
