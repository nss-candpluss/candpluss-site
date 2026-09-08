import { SiteImage } from "@/components/ui/SiteImage";
import { homeLabContent } from "@/data/home";

export function HomeLab() {
  return (
    <section data-header-theme="onDark" aria-label="C AND+S LABO" className="relative">
      <div className="relative h-svh w-full overflow-hidden">
        <SiteImage
          src={homeLabContent.backgroundImage}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
    </section>
  );
}
