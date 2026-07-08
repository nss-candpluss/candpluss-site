import { QualityFeatureLinks } from "@/sections/quality/QualityFeatureLinks";
import { QualityHero } from "@/sections/quality/QualityHero";
import { QualityPageViewport } from "@/sections/quality/QualityPageViewport";
import { QualityScrollSection } from "@/sections/quality/QualityScrollSection";

export function QualityPage() {
  return (
    <>
      <QualityPageViewport />
      <QualityHero />
      <QualityScrollSection />
      <QualityFeatureLinks />
    </>
  );
}
