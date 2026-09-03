import type { CommercialTransactionBlock } from "@/types/legal";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { commercialTransactionsContent } from "@/data/legal/commercialTransactions";
import {
  definitionLabelSpanClassName,
  definitionValueSpanClassName,
} from "@/lib/layout";
import { bodyText, uiText } from "@/lib/typography";

const listClassName =
  "list-disc space-y-[calc(12px*var(--gap-scale-y))] pl-[calc(20px*var(--gap-scale-x))]";

const bodyClassName = `font-body-ja text-[var(--foreground)] ${bodyText(15)}`;

const noteClassName = `font-body-ja text-[var(--foreground)] ${bodyText(14)}`;

const labelClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(16)}`;

const subheadingClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(15)}`;

const titleClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(18)}`;

function CommercialTransactionBlockRenderer({ block }: { block: CommercialTransactionBlock }) {
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
              {item}
            </li>
          ))}
        </ul>
      );
    case "note":
      return <p className={noteClassName}>{block.text}</p>;
  }
}

export function CommercialTransactionsDocument() {
  const { title, items } = commercialTransactionsContent;

  return (
    <article className="mx-auto w-full max-w-[980px]">
      <h1 className={titleClassName}>{title}</h1>

      <dl className="mt-[calc(52px*var(--gap-scale-y))]">
        {items.map((item) => (
          <SiteGrid
            key={item.label}
            className="gap-y-[calc(8px*var(--gap-scale-y))] border-b border-divider py-[calc(24px*var(--gap-scale-y))] first:pt-0 last:border-b-0 last:pb-0 min-[768px]:items-center min-[768px]:gap-x-[calc(32px*var(--gap-scale-x))] min-[768px]:gap-y-0"
          >
            <dt className={`${labelClassName} ${definitionLabelSpanClassName}`}>
              {item.label}
            </dt>
            <dd
              className={`flex min-w-0 flex-col gap-[calc(16px*var(--gap-scale-y))] ${definitionValueSpanClassName}`}
            >
              {item.blocks.map((block, index) => (
                <CommercialTransactionBlockRenderer
                  key={`${item.label}-${block.type}-${index}`}
                  block={block}
                />
              ))}
            </dd>
          </SiteGrid>
        ))}
      </dl>
    </article>
  );
}
