import Link from "next/link";
import { Fragment } from "react";

import { shoppingGuideContent } from "@/data/shoppingGuide";
import type { ShoppingGuideBlock, ShoppingGuideContent } from "@/types/shoppingGuide";
import { hoverUnderlineHoverClassName } from "@/components/ui/TextLink";
import { bodyText, uiText } from "@/lib/typography";

const listClassName =
  "mt-[calc(16px*var(--gap-scale-y))] list-none space-y-[calc(12px*var(--gap-scale-y))]";

const sectionBodyClassName =
  "mt-[calc(24px*var(--gap-scale-y))] space-y-[calc(16px*var(--gap-scale-y))]";

const pageTitleClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(18)}`;

const sectionHeadingClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(16)}`;

const bodyClassName = `font-body-ja text-[var(--foreground)] ${bodyText(15)}`;

const linkClassName = `${hoverUnderlineHoverClassName} ${bodyClassName}`;

function ShoppingGuideBlockRenderer({ block }: { block: ShoppingGuideBlock }) {
  switch (block.type) {
    case "paragraph":
    case "subheading":
    case "note":
      return <p className={`${bodyClassName} whitespace-pre-line`}>{block.text}</p>;
    case "bullets":
      return (
        <ul className={listClassName}>
          {block.items.map((item) => (
            <li key={item} className={bodyClassName}>
              ・{item}
            </li>
          ))}
        </ul>
      );
    case "link":
      if (block.external) {
        return (
          <p className={bodyClassName}>
            <a
              href={block.href}
              className={linkClassName}
              target="_blank"
              rel="noopener noreferrer"
            >
              {block.label}
            </a>
          </p>
        );
      }

      return (
        <p className={bodyClassName}>
          <Link href={block.href} className={linkClassName}>
            {block.label}
          </Link>
        </p>
      );
  }
}

export function ShoppingGuideDocument() {
  const { title, sections }: ShoppingGuideContent = shoppingGuideContent;

  return (
    <article className="mx-auto w-full max-w-[980px]">
      <div className="space-y-[calc(52px*var(--gap-scale-y))]">
        <section>
          <h1 className={pageTitleClassName}>{title}</h1>
        </section>

        {sections.map((section) => (
          <section key={section.title}>
            <h2 className={sectionHeadingClassName}>{section.title}</h2>
            <div className={sectionBodyClassName}>
              {section.subsections.map((subsection, subsectionIndex) => (
                <Fragment key={`${section.title}-${subsectionIndex}`}>
                  {subsection.heading ? (
                    <p className={`${bodyClassName} whitespace-pre-line`}>{subsection.heading}</p>
                  ) : null}
                  {subsection.blocks.map((block, index) => (
                    <ShoppingGuideBlockRenderer
                      key={`${section.title}-${subsectionIndex}-${block.type}-${index}`}
                      block={block}
                    />
                  ))}
                </Fragment>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
