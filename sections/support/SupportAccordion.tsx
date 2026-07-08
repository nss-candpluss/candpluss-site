"use client";

import { useId, useState } from "react";

import { bodyText, uiText } from "@/lib/typography";

type SupportAccordionItem = {
  title: string;
  body: string;
};

type SupportAccordionProps = {
  items: readonly SupportAccordionItem[];
};

const dividerClassName = "border-[var(--foreground)]/15";
const accordionTitleClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(20)}`;
const accordionBodyClassName = `font-body-ja text-[var(--foreground)] ${bodyText(15)}`;
const toggleIconClassName =
  "relative mr-[calc(12px*var(--gap-scale-x))] inline-flex size-[calc(16px*var(--text-scale))] shrink-0 items-center justify-center text-[var(--foreground)]";
const toggleLineHorizontalClassName =
  "absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-current";
const toggleLineVerticalClassName =
  "absolute top-1/2 left-1/2 h-[calc(16px*var(--text-scale))] w-px origin-center -translate-x-1/2 -translate-y-1/2 bg-current transition-transform duration-300 ease-in-out";

function SupportAccordionToggle({ isOpen }: { isOpen: boolean }) {
  return (
    <span className={toggleIconClassName} aria-hidden="true">
      <span className={toggleLineHorizontalClassName} />
      <span
        className={`${toggleLineVerticalClassName} ${isOpen ? "scale-y-0" : "scale-y-100"}`}
      />
    </span>
  );
}

type SupportAccordionPanelProps = {
  title: string;
  body: string;
  isOpen: boolean;
  panelId: string;
  buttonId: string;
  onToggle: () => void;
};

const accordionPanelTransitionClassName =
  "grid transition-[grid-template-rows] duration-300 ease-in-out";
const accordionContentTransitionClassName =
  "transition-opacity duration-300 ease-in-out";

function SupportAccordionPanel({
  title,
  body,
  isOpen,
  panelId,
  buttonId,
  onToggle,
}: SupportAccordionPanelProps) {
  return (
    <div className={`border-b pb-[calc(32px*var(--gap-scale-y))] ${dividerClassName}`}>
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full cursor-pointer items-center justify-between gap-x-[calc(16px*var(--gap-scale-x))] gap-y-[calc(16px*var(--gap-scale-y))] pt-[calc(32px*var(--gap-scale-y))] text-left"
        >
          <span className={accordionTitleClassName}>{title}</span>
          <SupportAccordionToggle isOpen={isOpen} />
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={accordionPanelTransitionClassName}
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`pt-[calc(32px*var(--gap-scale-y))] ${accordionContentTransitionClassName} ${isOpen ? "opacity-100" : "opacity-0"}`}
          >
            <p className={`${accordionBodyClassName} whitespace-pre-line`}>{body}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SupportAccordion({ items }: SupportAccordionProps) {
  const baseId = useId();
  const [openIndices, setOpenIndices] = useState<ReadonlySet<number>>(() => new Set());

  const toggleItem = (index: number) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);

      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      return next;
    });
  };

  return (
    <div className={`border-t ${dividerClassName}`}>
      {items.map((item, index) => {
        const isOpen = openIndices.has(index);
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <SupportAccordionPanel
            key={item.title}
            title={item.title}
            body={item.body}
            isOpen={isOpen}
            panelId={panelId}
            buttonId={buttonId}
            onToggle={() => toggleItem(index)}
          />
        );
      })}
    </div>
  );
}
