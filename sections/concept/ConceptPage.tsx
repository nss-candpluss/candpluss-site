import { Container } from "@/components/ui/Container";
import { SiteImage } from "@/components/ui/SiteImage";
import { SiteGrid } from "@/components/ui/SiteGrid";

import { conceptContent } from "@/data/concept";
import {
  conceptTitleWrapClassName,
  splitConceptTitleWrapUnits,
} from "@/lib/concept-title";
import {
  conceptStoryContentSpanClassName,
  conceptStoryHeadingSpanClassName,
} from "@/lib/layout";
import {
  conceptHeadingEnglishGapClassName,
  conceptHeadingNumeralClassName,
  conceptStoryBodyClassName,
  conceptStoryTitleClassName,
} from "@/lib/typography";
import { ConceptFeatureLinks } from "@/sections/concept/ConceptFeatureLinks";
import { ConceptParallaxRegion } from "@/sections/concept/ConceptParallaxRegion";
import { ConceptSectionNav } from "@/sections/concept/ConceptSectionNav";

function ConceptStoryHeading({
  as: Tag,
  title,
  className = "",
  animateIntro = false,
}: {
  as: "h1" | "h2";
  title: string;
  className?: string;
  animateIntro?: boolean;
}) {
  const separatorIndex = title.indexOf("｜");
  const indexLabel = separatorIndex === -1 ? title : title.slice(0, separatorIndex);
  const englishTitle = separatorIndex === -1 ? "" : title.slice(separatorIndex + 1);

  return (
    <Tag className={`font-heading ${conceptStoryHeadingSpanClassName} ${className}`.trim()}>
      <span
        aria-label={animateIntro ? indexLabel : undefined}
        className={`concept-heading-index inline-flex items-baseline ${conceptHeadingNumeralClassName}`}
      >
        <span className="concept-heading-numeral">
          {animateIntro
            ? Array.from(indexLabel).map((character, index) => (
                <span
                  key={`${character}-${index}`}
                  aria-hidden="true"
                  data-concept-intro-number-character
                  className="inline-block"
                  style={{ opacity: 0, transform: "translateY(0.6em)" }}
                >
                  {character}
                </span>
              ))
            : indexLabel}
        </span>
        <span
          aria-hidden="true"
          data-concept-intro-rule={animateIntro ? "" : undefined}
          className="relative top-[0.043em] ml-[0.28em] inline-block h-[0.54em] w-px shrink-0 self-baseline bg-current"
          style={animateIntro ? { opacity: 0 } : undefined}
        />
      </span>
      {englishTitle ? (
        <span
          aria-label={animateIntro ? englishTitle : undefined}
          className={`block ${conceptStoryTitleClassName} ${conceptHeadingEnglishGapClassName}`}
        >
          <span className={conceptTitleWrapClassName}>
            {splitConceptTitleWrapUnits(englishTitle).map((unit, unitIndex) => (
              <span key={`${unit}-${unitIndex}`} className="inline-flex">
                {animateIntro
                  ? Array.from(unit).map((character, index) => (
                      <span
                        key={`${character}-${index}`}
                        aria-hidden="true"
                        data-concept-intro-title-character
                        className="inline-block"
                        style={{ opacity: 0 }}
                      >
                        {character === " " ? "\u00a0" : character}
                      </span>
                    ))
                  : unit}
              </span>
            ))}
          </span>
        </span>
      ) : null}
    </Tag>
  );
}

function ConceptOutroTitle({ title }: { title: string }) {
  return (
    <div data-concept-outro-title-pin className="col-span-12">
      <h2
        data-concept-outro-title
        aria-label={title}
        className={`${conceptTitleWrapClassName} font-heading ${conceptStoryTitleClassName}`}
        style={{ opacity: 0, transform: "translateY(40px)" }}
      >
        {splitConceptTitleWrapUnits(title).map((unit, unitIndex) => (
          <span
            key={`${unit}-${unitIndex}`}
            className="inline-block"
            aria-hidden="true"
          >
            {unit}
          </span>
        ))}
      </h2>
    </div>
  );
}

export function ConceptPage() {
  return (
    <>
      <ConceptParallaxRegion className="relative bg-black">
        <div data-concept-story-region className="relative">
          <ConceptSectionNav sections={conceptContent.sections} />

          <div
            data-concept-background-stage
            className="pointer-events-none sticky top-0 h-svh overflow-hidden"
            aria-hidden="true"
          >
            {conceptContent.sections.map((section, index) => (
              <div
                key={section.id}
                data-concept-background={section.id}
                className={`absolute inset-0 origin-center ${
                  index === 0 ? "opacity-100" : "opacity-0"
                }`}
              >
                <SiteImage
                  src={section.backgroundImage}
                  alt=""
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover object-center"
                />
              </div>
            ))}
            <div className="absolute inset-0 bg-black/45" />
            <div
              data-concept-intro-black
              className="absolute inset-0 bg-black"
            />
          </div>

          <div className="relative z-10 -mt-[100svh]">
            {conceptContent.sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                data-concept-section
                data-concept-index={index}
                data-header-theme="onDark"
                className={
                  index === 0
                    ? "relative min-h-svh min-[1024px]:min-h-[140svh]"
                    : "relative flex min-h-svh items-center min-[1024px]:min-h-[140svh]"
                }
              >
                <div
                  data-concept-parallax
                  className="w-full"
                >
                  <Container
                    className={`${
                      index === 0 ? "" : "pt-[var(--container-y-top)]"
                    } pb-[var(--container-y-bottom)] text-white`}
                  >
                    <SiteGrid className="w-full text-center">
                      {index === 0 ? (
                        <div className="col-span-12 flex h-[50svh] w-full items-end">
                          <ConceptStoryHeading
                            as="h1"
                            title={section.title}
                            className="w-full"
                            animateIntro
                          />
                        </div>
                      ) : (
                        <ConceptStoryHeading
                          as="h2"
                          title={section.title}
                          animateIntro
                        />
                      )}
                      <p
                        data-concept-intro-body
                        className={`${conceptStoryContentSpanClassName} mt-[var(--section-title-gap)] mx-auto w-full max-w-[880px] whitespace-pre-line font-body-ja min-[1024px]:mx-0 min-[1024px]:max-w-none ${conceptStoryBodyClassName}`}
                        style={{ opacity: 0, transform: "translateY(32px)" }}
                      >
                        {section.body}
                      </p>
                    </SiteGrid>
                  </Container>
                </div>
              </section>
            ))}
          </div>
        </div>
        <section
          data-concept-outro
          data-header-theme="onDark"
          className="relative z-20 flex min-h-svh items-center bg-black"
        >
          <Container className="w-full text-white">
            <SiteGrid>
              <ConceptOutroTitle title={conceptContent.outroTitle} />
            </SiteGrid>
          </Container>
        </section>
      </ConceptParallaxRegion>
      <ConceptFeatureLinks />
    </>
  );
}
