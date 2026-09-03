import { SiteImage } from "@/components/ui/SiteImage";

import { qualityContent } from "@/data/quality";
import { assetPath } from "@/lib/assetPath";
import { bodyText, conceptStoryTitleClassName, uiText } from "@/lib/typography";

export function QualityHero() {
  const { hero } = qualityContent;

  return (
    <section data-header-theme="onDark" data-quality-hero className="relative overflow-hidden text-white">
      <div className="absolute inset-0" aria-hidden="true">
        <SiteImage
          src={hero.image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1050px] px-[var(--container-x)] pb-[var(--container-y-bottom)] text-center">
        <div className="flex h-[50svh] w-full items-end">
          <h1 className={`w-full font-heading ${conceptStoryTitleClassName}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assetPath(hero.titleLogo)}
              alt={hero.title}
              className="mx-auto h-auto w-[min(100%,calc(1em*814.088/72.001))] brightness-0 invert"
            />
          </h1>
        </div>
        <p
          className={`mt-[calc(32px*var(--gap-scale-y))] font-ui-en font-medium ${uiText(21)}`}
        >
          {hero.label}
        </p>

        <div
          className={`mt-[var(--section-title-gap)] flex flex-col gap-y-[calc(15.75px*var(--text-scale))]`}
        >
          {hero.body.split("\n\n").map((paragraph) => (
            <p
              key={paragraph}
              className={`whitespace-pre-line font-body-ja ${bodyText(18)}`}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
