import type { Metadata } from "next";

import { supportContent } from "@/data/support";
import { SupportPage } from "@/sections/support/SupportPage";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `${supportContent.title} | ${siteConfig.name}`,
  description: `${siteConfig.name}のサポート・永久保証について紹介するページです。`,
};

export default function SupportRoutePage() {
  return (
    <main data-header-theme="onDark">
      <SupportPage />
    </main>
  );
}
