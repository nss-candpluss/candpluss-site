import { SupportGuide } from "@/sections/support/SupportGuide";
import { SupportHashScroll } from "@/sections/support/SupportHashScroll";
import { SupportHero } from "@/sections/support/SupportHero";
import { SupportStickyRegion } from "@/sections/support/SupportStickyRegion";

export function SupportPage() {
  return (
    <SupportStickyRegion>
      <SupportHero />
      <SupportGuide />
      <SupportHashScroll />
    </SupportStickyRegion>
  );
}
