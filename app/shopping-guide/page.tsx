import type { Metadata } from "next";

import { ShoppingGuideDocument } from "@/components/shopping-guide/ShoppingGuideDocument";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { shoppingGuideContent } from "@/data/shoppingGuide";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `${shoppingGuideContent.title} | ${siteConfig.name}`,
  description: `${siteConfig.name}の${shoppingGuideContent.title}ページです。`,
};

export default function ShoppingGuidePage() {
  return (
    <LegalPageLayout>
      <ShoppingGuideDocument />
    </LegalPageLayout>
  );
}
