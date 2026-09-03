import { HomeFeatureLinks } from "@/sections/home/HomeFeatureLinks";
import { HomeHero } from "@/sections/home/HomeHero";
import { HomeLab } from "@/sections/home/HomeLab";
import { HomeMainProducts } from "@/sections/home/HomeMainProducts";
import { HomeNews } from "@/sections/home/HomeNews";

export default function Home() {
  return (
    <main>
      <HomeHero />
      <HomeMainProducts />
      <HomeNews />
      <HomeFeatureLinks />
      <HomeLab />
    </main>
  );
}
