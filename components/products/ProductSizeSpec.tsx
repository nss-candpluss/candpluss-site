import { SiteImage } from "@/components/ui/SiteImage";

import type { ProductSizeSpec } from "@/types/product";
import { bodyText, sectionTitle62ClassName, uiText } from "@/lib/typography";

type ProductSizeSpecProps = {
  sizeSpec: ProductSizeSpec;
  typography?: {
    title?: string;
    itemName?: string;
    content?: string;
    note?: string;
    download?: string;
  };
};

function ProductSizeSpecContent({
  sizeSpec,
  typography,
}: ProductSizeSpecProps) {
  const itemNameClassName = typography?.itemName ?? uiText(14);
  const contentClassName = typography?.content ?? bodyText(14);
  const noteClassName = typography?.note ?? bodyText(14);

  if (sizeSpec.specGroups?.length) {
    return (
      <div className="flex flex-col">
        {sizeSpec.specGroups.map((group) => (
          <div
            key={group.label}
            className="flex flex-col gap-[calc(16px*var(--gap-scale-y))] border-b border-divider py-[calc(32px*var(--gap-scale-y))] first:pt-0 last:border-b-0 last:pb-0"
          >
            <h3 className={`font-body-ja font-semibold text-[var(--foreground)] ${itemNameClassName}`}>
              {group.label}
            </h3>
            <p
              className={`whitespace-pre-line font-body-ja text-[var(--foreground)] ${contentClassName}`}
            >
              {group.value}
            </p>
          </div>
        ))}

        {sizeSpec.notes?.length ? (
          <ul className="mt-[calc(24px*var(--gap-scale-y))] flex flex-col gap-[calc(12px*var(--gap-scale-y))]">
            {sizeSpec.notes.map((note) => (
              <li
                key={note}
                className={`font-body-ja text-[var(--color-muted)] ${noteClassName}`}
              >
                {note}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  if (!sizeSpec.specs?.length) {
    return null;
  }

  return (
    <dl className="flex flex-col gap-[calc(16px*var(--gap-scale-y))]">
      {sizeSpec.specs.map((spec) => (
        <div
          key={spec.label}
          className="grid grid-cols-[minmax(0,120px)_1fr] gap-x-[calc(16px*var(--gap-scale-x))] gap-y-[calc(16px*var(--gap-scale-y))] border-b border-divider pb-[calc(12px*var(--gap-scale-y))]"
        >
          <dt className={`font-body-ja text-[var(--color-muted)] ${itemNameClassName}`}>
            {spec.label}
          </dt>
          <dd className={`font-body-ja text-[var(--foreground)] ${contentClassName}`}>
            {spec.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ProductSizeSpecSection({
  sizeSpec,
  typography,
}: ProductSizeSpecProps) {
  const hasDrawing = Boolean(sizeSpec.drawingImage);
  const centeredContentClassName = "mx-auto w-full max-w-[880px]";

  const titleClassName = `font-heading text-[var(--foreground)] ${
    typography?.title ?? sectionTitle62ClassName
  }`;
  const downloadClassName = typography?.download ?? uiText(14);

  const downloadsList =
    sizeSpec.downloads?.length ? (
      <ul className="mt-[calc(40px*var(--gap-scale-y))] flex flex-col gap-[calc(12px*var(--gap-scale-y))]">
        {sizeSpec.downloads.map((download) => (
          <li key={download.href}>
            <a
              href={download.href}
              className={`font-body-ja text-[var(--foreground)] underline decoration-1 underline-offset-[calc(4px*var(--text-scale))] ${downloadClassName}`}
            >
              {download.label}
            </a>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <section
      id="size-spec"
      className="scroll-mt-[var(--header-height)] bg-[#f5f5f5] px-[var(--container-x)] pt-[var(--container-y-top)] pb-[var(--container-y-bottom)]"
    >
      {hasDrawing ? (
        <>
          <h2 className={titleClassName}>Size &amp; Spec</h2>

          <div className="mt-[calc(98px*var(--gap-scale-y))] grid grid-cols-1 items-start gap-x-[calc(72px*var(--gap-scale-x))] gap-y-[calc(72px*var(--gap-scale-y))] min-[1024px]:grid-cols-2">
            <ProductSizeSpecContent sizeSpec={sizeSpec} typography={typography} />

            <div className="w-full self-start bg-white px-[calc(144px*var(--gap-scale-x))] py-[calc(92px*var(--gap-scale-y))]">
              <SiteImage
                src={sizeSpec.drawingImage!.src}
                alt={sizeSpec.drawingImage!.alt}
                width={0}
                height={0}
                sizes="(min-width: 1024px) 40vw, 100vw"
                unoptimized
                className="block h-auto w-full"
                style={{ width: "100%", height: "auto" }}
              />
            </div>
          </div>

          {downloadsList}
        </>
      ) : (
        <div className={centeredContentClassName}>
          <h2 className={titleClassName}>Size &amp; Spec</h2>

          <div className="mt-[calc(98px*var(--gap-scale-y))]">
            <ProductSizeSpecContent sizeSpec={sizeSpec} typography={typography} />
          </div>

          {downloadsList}
        </div>
      )}
    </section>
  );
}
