import type { Metadata } from "next";

import { TermsDocument } from "@/components/legal/TermsDocument";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { termsContent } from "@/data/legal/terms";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `${termsContent.title} | ${siteConfig.name}`,
  description: `${siteConfig.name}の${termsContent.title}ページです。`,
};

export default function TermsPage() {
  return (
    <LegalPageLayout>
      <TermsDocument />
    </LegalPageLayout>
  );
}
