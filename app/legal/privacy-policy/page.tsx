import type { Metadata } from "next";

import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { PrivacyPolicyDocument } from "@/components/legal/PrivacyPolicyDocument";
import { privacyPolicyContent } from "@/data/legal/privacyPolicy";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `${privacyPolicyContent.title} | ${siteConfig.name}`,
  description: `${siteConfig.name}の${privacyPolicyContent.title}ページです。`,
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout>
      <PrivacyPolicyDocument />
    </LegalPageLayout>
  );
}
