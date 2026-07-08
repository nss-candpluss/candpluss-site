import { HomeFeatureLinks } from "@/sections/home/HomeFeatureLinks";
import { HomeHero } from "@/sections/home/HomeHero";
import { HomeLab } from "@/sections/home/HomeLab";
import { HomeNews } from "@/sections/home/HomeNews";
import { HomeProductLinks } from "@/sections/home/HomeProductLinks";
import { HomeSupport } from "@/sections/home/HomeSupport";

export default function Home() {
  return (
    <main>
      <HomeHero />
      <HomeFeatureLinks />
      <HomeProductLinks />
      <HomeNews />
      <HomeLab />
      <HomeSupport />
    </main>
  );
}
