import Link from "next/link";

import { shoppingGuideContent } from "@/data/shoppingGuide";
import type { ShoppingGuideBlock } from "@/types/shoppingGuide";
import { hoverUnderlineHoverClassName } from "@/components/ui/TextLink";
import { bodyText, uiText } from "@/lib/typography";

const listClassName = "list-none space-y-[calc(12px*var(--gap-scale-y))]";

const bodyClassName = `font-body-ja text-[var(--foreground)] ${bodyText(15)}`;

const noteClassName = `font-body-ja text-[var(--foreground)] ${bodyText(14)}`;

const sectionHeadingClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(16)}`;

const subsectionHeadingClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(15)}`;

const subheadingClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(15)}`;

const titleClassName = `font-heading text-[var(--foreground)] ${uiText(16)}`;

const linkClassName = `${hoverUnderlineHoverClassName} ${bodyClassName}`;

function ShoppingGuideBlockRenderer({ block }: { block: ShoppingGuideBlock }) {
  switch (block.type) {
    case "paragraph":
      return <p className={bodyClassName}>{block.text}</p>;
    case "subheading":
      return <p className={subheadingClassName}>{block.text}</p>;
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
    case "note":
      return <p className={noteClassName}>{block.text}</p>;
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
  const { title, sections } = shoppingGuideContent;

  return (
    <article className="mx-auto w-full max-w-[980px]">
      <h1 className={titleClassName}>{title}</h1>

      <div className="mt-[calc(52px*var(--gap-scale-y))] flex flex-col gap-[calc(52px*var(--gap-scale-y))]">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className={sectionHeadingClassName}>{section.title}</h2>

            <div className="mt-[calc(24px*var(--gap-scale-y))] flex flex-col gap-[calc(32px*var(--gap-scale-y))]">
              {section.subsections.map((subsection, subsectionIndex) => (
                <div
                  key={`${section.title}-${subsectionIndex}`}
                  className="flex flex-col gap-[calc(16px*var(--gap-scale-y))]"
                >
                  {"heading" in subsection && subsection.heading ? (
                    <h3 className={subsectionHeadingClassName}>{subsection.heading}</h3>
                  ) : null}

                  {subsection.blocks.map((block, index) => (
                    <ShoppingGuideBlockRenderer
                      key={`${section.title}-${subsectionIndex}-${block.type}-${index}`}
                      block={block}
                    />
                  ))}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
