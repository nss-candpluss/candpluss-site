import { SiteImage } from "@/components/ui/SiteImage";
import { forwardRef } from "react";

import { conceptContent } from "@/data/concept";
import { assetPath } from "@/lib/assetPath";
import { bodyText, uiText } from "@/lib/typography";

type ConceptSectionContentProps = {
  section: (typeof conceptContent.sections)[number];
};

const contentShellClassName =
  "mx-auto flex w-full max-w-[880px] flex-col items-center px-[var(--container-x)] text-center text-white";

const bodyClassName = `font-body-ja ${bodyText(18)}`;

const titleClassName = `font-body-ja font-semibold ${uiText(20)}`;

const sectionLogoClassName = "concept-section-logo";
const sectionHeadingClassName = "concept-section-heading";
const sectionBodyClassName = "concept-section-body";

export const ConceptTopContent = forwardRef<HTMLDivElement>(function ConceptTopContent(
  _,
  ref
) {
  const { logo, top } = conceptContent;

  return (
    <div ref={ref} className={contentShellClassName}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={assetPath(logo.src)}
        alt={logo.alt}
        className="h-[calc(93px*var(--text-scale))] w-auto max-w-full"
      />

      <p className={`mt-[calc(98px*var(--gap-scale-y))] ${titleClassName}`}>
        {top.lead}
      </p>

      <p className={`mt-[calc(32px*var(--gap-scale-y))] ${bodyClassName} whitespace-pre-line`}>
        {top.body}
      </p>
    </div>
  );
});

export const ConceptSectionContent = forwardRef<HTMLDivElement, ConceptSectionContentProps>(
  function ConceptSectionContent({ section }, ref) {
    return (
      <div ref={ref} className={contentShellClassName}>
        <div
          className={`${sectionLogoClassName} relative h-[calc(92px*var(--text-scale))] w-full max-w-[520px]`}
        >
          <SiteImage
            src={section.headingImage}
            alt={section.headingAlt}
            fill
            sizes="(min-width: 768px) 520px, 90vw"
            className="object-contain object-center"
          />
        </div>

        <h2
          className={`${sectionHeadingClassName} mt-[calc(62px*var(--gap-scale-y))] ${titleClassName}`}
        >
          {section.subtitle}
        </h2>

        <p
          className={`${sectionBodyClassName} mt-[calc(32px*var(--gap-scale-y))] ${bodyClassName} whitespace-pre-line`}
        >
          {section.body}
        </p>
      </div>
    );
  }
);
