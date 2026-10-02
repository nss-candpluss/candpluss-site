import { homeLabContent } from "@/data/home";
import { HomeLabSlideshow } from "@/sections/home/HomeLabSlideshow";

export function HomeLab() {
  return (
    <section data-header-theme="onDark" aria-label="C AND+S LABO" className="relative">
      <HomeLabSlideshow slides={homeLabContent.slides} />
    </section>
  );
}
