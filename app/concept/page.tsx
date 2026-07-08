import type { Metadata } from "next";

import { conceptContent } from "@/data/concept";
import { ConceptPage } from "@/sections/concept/ConceptPage";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `${conceptContent.title} | ${siteConfig.name}`,
  description: `${siteConfig.name}のブランドコンセプトページです。`,
};

export default function ConceptRoutePage() {
  return (
    <main data-header-theme="onDark">
      <ConceptPage />
    </main>
  );
}
