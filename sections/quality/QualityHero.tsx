import { SiteImage } from "@/components/ui/SiteImage";

import { qualityContent } from "@/data/quality";
import { bodyText, uiText } from "@/lib/typography";

export function QualityHero() {
  const { hero } = qualityContent;

  return (
    <section data-header-theme="onDark" className="relative h-[calc(var(--app-vh)*100)] overflow-hidden">
      <SiteImage
        src={hero.image}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      <div className="relative z-10 flex h-full items-center px-[var(--container-x)] py-[var(--container-y-bottom)]">
        <div className="mx-auto w-full text-center text-white">
          <h1 className="font-heading quality-hero-title">{hero.title}</h1>

          <p
            className={`mt-[calc(98px*var(--gap-scale-y))] font-ui-en font-medium ${uiText(21)}`}
          >
            {hero.label}
          </p>

          <p
            className={`mt-[calc(32px*var(--gap-scale-y))] whitespace-pre-line font-body-ja ${bodyText(18)}`}
          >
            {hero.body}
          </p>
        </div>
      </div>
    </section>
  );
}
