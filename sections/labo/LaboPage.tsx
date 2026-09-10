import { LaboAbout } from "@/sections/labo/LaboAbout";
import { LaboAccess } from "@/sections/labo/LaboAccess";
import { LaboActivities } from "@/sections/labo/LaboActivities";
import { LaboDesign } from "@/sections/labo/LaboDesign";
import { LaboHero } from "@/sections/labo/LaboHero";
import { LaboVisit } from "@/sections/labo/LaboVisit";

export function LaboPage() {
  return (
    <div className="relative">
      <LaboHero />
      <div data-labo-content className="relative z-20">
        <LaboAbout />
        <LaboActivities />
        <LaboDesign />
        <LaboVisit />
        <LaboAccess />
      </div>
    </div>
  );
}
