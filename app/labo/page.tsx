import type { Metadata } from "next";

import { laboContent } from "@/data/labo";
import { LaboPage } from "@/sections/labo/LaboPage";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `${laboContent.title} | ${siteConfig.name}`,
  description: `${siteConfig.name} LABOは、製品を実際に見て、触れて、品質やサイズ感を確かめられるブランド体験スペースです。`,
};

export default function LaboRoutePage() {
  return (
    <main data-header-theme="onDark">
      <LaboPage />
    </main>
  );
}
