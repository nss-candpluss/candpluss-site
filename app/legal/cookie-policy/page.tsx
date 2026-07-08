import type { Metadata } from "next";

import { CookiePolicyDocument } from "@/components/legal/CookiePolicyDocument";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { cookiePolicyContent } from "@/data/legal/cookiePolicy";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `${cookiePolicyContent.title} | ${siteConfig.name}`,
  description: `${siteConfig.name}の${cookiePolicyContent.title}ページです。`,
};

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout>
      <CookiePolicyDocument />
    </LegalPageLayout>
  );
}
