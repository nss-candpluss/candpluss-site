import { HomeFeatureLinks } from "@/sections/home/HomeFeatureLinks";
import { HomeHero } from "@/sections/home/HomeHero";
import { HomeLab } from "@/sections/home/HomeLab";
import { HomeMainProducts } from "@/sections/home/HomeMainProducts";
import { HomeNews } from "@/sections/home/HomeNews";
import { HomeStickyRegion } from "@/sections/home/HomeStickyRegion";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  description: siteConfig.description,
  path: "/",
});

export default function Home() {
  return (
    <main>
      <HomeStickyRegion>
        <HomeHero />
        <div data-home-covering className="relative z-20">
          <HomeMainProducts />
          <HomeNews />
          <HomeFeatureLinks />
          <HomeLab />
        </div>
      </HomeStickyRegion>
    </main>
  );
}
