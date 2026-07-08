import type { Metadata } from "next";

import { qualityContent } from "@/data/quality";
import { QualityPage } from "@/sections/quality/QualityPage";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `${qualityContent.title} | ${siteConfig.name}`,
  description: `${siteConfig.name}の品質への考え方を紹介するページです。`,
};

export default function QualityRoutePage() {
  return (
    <main data-header-theme="onDark">
      <QualityPage />
    </main>
  );
}
