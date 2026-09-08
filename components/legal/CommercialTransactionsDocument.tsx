import type { CommercialTransactionBlock } from "@/types/legal";
import { commercialTransactionsContent } from "@/data/legal/commercialTransactions";
import { bodyText, uiText } from "@/lib/typography";

const listClassName =
  "mt-[calc(16px*var(--gap-scale-y))] list-none space-y-[calc(12px*var(--gap-scale-y))]";

const sectionBodyClassName =
  "mt-[calc(24px*var(--gap-scale-y))] space-y-[calc(16px*var(--gap-scale-y))]";

const pageTitleClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(18)}`;

const sectionHeadingClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(16)}`;

const bodyClassName = `font-body-ja text-[var(--foreground)] ${bodyText(15)}`;

const noteClassName = `font-body-ja text-[var(--foreground)] ${bodyText(14)}`;

const subheadingClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(15)}`;

function CommercialTransactionBlockRenderer({ block }: { block: CommercialTransactionBlock }) {
  switch (block.type) {
    case "paragraph":
      return <p className={`${bodyClassName} whitespace-pre-line`}>{block.text}</p>;
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
  }
}

export function CommercialTransactionsDocument() {
  const { title, items } = commercialTransactionsContent;

  return (
    <article className="mx-auto w-full max-w-[980px]">
      <div className="space-y-[calc(52px*var(--gap-scale-y))]">
        <section>
          <h1 className={pageTitleClassName}>{title}</h1>
        </section>

        {items.map((item) => (
          <section key={item.label}>
            <h2 className={sectionHeadingClassName}>{item.label}</h2>
            <div className={sectionBodyClassName}>
              {item.blocks.map((block, index) => (
                <CommercialTransactionBlockRenderer
                  key={`${item.label}-${block.type}-${index}`}
                  block={block}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
