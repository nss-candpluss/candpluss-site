import type { CompanyInfoBlock, CompanyInfoItem } from "@/types/company";
import { SiteImage } from "@/components/ui/SiteImage";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { companyContent } from "@/data/company";
import { homeLabContent } from "@/data/home";
import {
  definitionLabelSpanClassName,
  definitionValueSpanClassName,
} from "@/lib/layout";
import { bodyText, sectionTitle62ClassName, uiText } from "@/lib/typography";

const listClassName =
  "list-disc space-y-[calc(12px*var(--gap-scale-y))] pl-[calc(20px*var(--gap-scale-x))]";

const bodyClassName = `font-body-ja text-[var(--foreground)] ${bodyText(15)}`;

const labelClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(16)}`;

const linkClassName = `underline decoration-solid underline-offset-[calc(4/15*1em)] ${bodyClassName}`;

const pageTitleClassName = `font-heading text-[var(--foreground)] ${sectionTitle62ClassName}`;

const sectionTitleClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(18)}`;

const tableRowClassName =
  "gap-y-[calc(8px*var(--gap-scale-y))] border-b border-divider py-[calc(24px*var(--gap-scale-y))] first:pt-0 last:border-b-0 last:pb-0 min-[768px]:items-center min-[768px]:gap-x-[calc(32px*var(--gap-scale-x))] min-[768px]:gap-y-0";

function CompanyInfoBlockRenderer({ block }: { block: CompanyInfoBlock }) {
  switch (block.type) {
    case "paragraph":
      return <p className={bodyClassName}>{block.text}</p>;
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
    case "linkedLine":
      return (
        <p className={bodyClassName}>
          {block.text}（
          <a
            href={block.href}
            className={linkClassName}
            target="_blank"
            rel="noopener noreferrer"
          >
            {block.href}
          </a>
          ）
        </p>
      );
  }
}

function CompanyInfoTable({ items }: { items: readonly CompanyInfoItem[] }) {
  return (
    <dl>
      {items.map((item) => (
        <SiteGrid key={item.label} className={tableRowClassName}>
          <dt className={`${labelClassName} ${definitionLabelSpanClassName}`}>{item.label}</dt>
          <dd
            className={`flex min-w-0 flex-col gap-[calc(16px*var(--gap-scale-y))] ${definitionValueSpanClassName}`}
          >
            {item.blocks.map((block, index) => (
              <CompanyInfoBlockRenderer
                key={`${item.label}-${block.type}-${index}`}
                block={block}
              />
            ))}
          </dd>
        </SiteGrid>
      ))}
    </dl>
  );
}

export function CompanyDocument() {
  const { title, labTitle, labItems, tableTitle, items } = companyContent;

  return (
    <>
      <h1 className={pageTitleClassName}>{title}</h1>

      <div className="relative mt-[calc(98px*var(--layout-scale-y))] -mx-[var(--container-x)] aspect-[16/9] w-[calc(100%+2*var(--container-x))] overflow-hidden min-[1024px]:aspect-[2/1]">
        <SiteImage
          src={homeLabContent.backgroundImage}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <p
          className={`absolute bottom-[var(--container-y-bottom)] left-[var(--container-x)] z-10 font-heading text-white ${sectionTitle62ClassName}`}
        >
          {labTitle}
        </p>
      </div>

      <section className="mx-auto mt-[calc(98px*var(--layout-scale-y))] w-full max-w-[980px]">
        <CompanyInfoTable items={labItems} />
      </section>

      <section className="-mx-[var(--container-x)] mt-[calc(98px*var(--layout-scale-y))] w-[calc(100%+2*var(--container-x))] bg-[#f5f5f5] px-[var(--container-x)] py-[var(--container-y-bottom)]">
        <div className="mx-auto w-full max-w-[980px]">
          <h2 className={sectionTitleClassName}>{tableTitle}</h2>
          <div className="mt-[calc(52px*var(--gap-scale-y))]">
            <CompanyInfoTable items={items} />
          </div>
        </div>
      </section>
    </>
  );
}
