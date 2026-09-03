import { SupportGuide } from "@/sections/support/SupportGuide";
import { SupportHero } from "@/sections/support/SupportHero";
import { SupportStickyRegion } from "@/sections/support/SupportStickyRegion";

export function SupportPage() {
  return (
    <SupportStickyRegion>
      <SupportHero />
      <SupportGuide />
    </SupportStickyRegion>
  );
}
