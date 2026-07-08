import type { Metadata } from "next";

import { CommercialTransactionsDocument } from "@/components/legal/CommercialTransactionsDocument";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { commercialTransactionsContent } from "@/data/legal/commercialTransactions";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `${commercialTransactionsContent.title} | ${siteConfig.name}`,
  description: `${siteConfig.name}の${commercialTransactionsContent.title}ページです。`,
};

export default function CommercialTransactionsPage() {
  return (
    <LegalPageLayout>
      <CommercialTransactionsDocument />
    </LegalPageLayout>
  );
}
