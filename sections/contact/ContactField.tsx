import type { ReactNode } from "react";

import { contactFormCopy } from "@/data/contact";
import { uiText } from "@/lib/typography";
import {
  contactErrorClassName,
  contactFormRowClassName,
  contactTitleToContentGapClassName,
} from "@/sections/contact/contactStyles";

type ContactFieldProps = {
  label: string;
  requirement: "required" | "optional";
  htmlFor?: string;
  anchorId?: string;
  note?: string | readonly string[];
  error?: string;
  hideHeader?: boolean;
  horizontalOnDesktop?: boolean;
  fixedTitleSize?: boolean;
  groupedContentGap?: boolean;
  embedded?: boolean;
  children: ReactNode;
};

const labelClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(16)}`;
const fixedLabelClassName =
  "py-[5px] font-body-ja text-[16px] leading-[16px] font-bold text-[var(--foreground)]";

const requirementClassName = `shrink-0 font-body-ja text-[var(--color-muted)] ${uiText(13)}`;

const noteClassName =
  "mt-[clamp(8px,calc(12px*var(--gap-scale-y)),12px)] font-body-ja text-[clamp(12px,calc(13px*var(--text-scale)),13px)] leading-[1.3] text-[var(--color-muted)]";

export function ContactField({
  label,
  requirement,
  htmlFor,
  anchorId,
  note,
  error,
  hideHeader = false,
  horizontalOnDesktop = false,
  fixedTitleSize = false,
  groupedContentGap = false,
  embedded = false,
  children,
}: ContactFieldProps) {
  const requirementLabel = contactFormCopy.requirementLabels[requirement];
  const titleClassName = fixedTitleSize
    ? fixedLabelClassName
    : labelClassName;
  const horizontalClassName = horizontalOnDesktop
    ? " min-[1025px]:grid min-[1025px]:grid-cols-[max-content_1fr] min-[1025px]:items-center min-[1025px]:gap-x-[calc(48px*var(--gap-scale-x))]"
    : "";

  return (
    <div
      id={anchorId}
      className={`${embedded ? "" : contactFormRowClassName}${horizontalClassName}${anchorId ? " scroll-mt-[calc(var(--header-height)+16px)]" : ""}`}
    >
      {hideHeader ? null : (
        <div className="flex items-start justify-between gap-x-[calc(16px*var(--gap-scale-x))] gap-y-[calc(8px*var(--gap-scale-y))]">
          {htmlFor ? (
            <label htmlFor={htmlFor} className={titleClassName}>
              {label}
            </label>
          ) : (
            <p className={titleClassName}>{label}</p>
          )}
          <span className={requirementClassName}>{requirementLabel}</span>
        </div>
      )}

      <div
        className={
          hideHeader
            ? undefined
            : horizontalOnDesktop
              ? "mt-[18px] min-[1025px]:mt-0"
              : groupedContentGap
                ? contactTitleToContentGapClassName
                : "mt-[calc(16px*var(--gap-scale-y))]"
        }
      >
        {children}
      </div>

      {note ? (
        Array.isArray(note) ? (
          note.map((line) => (
            <p key={line} className={noteClassName}>
              {line}
            </p>
          ))
        ) : (
          <p className={noteClassName}>{note}</p>
        )
      ) : null}

      {error ? (
        <p
          className={`${contactErrorClassName}${horizontalOnDesktop ? " min-[1025px]:col-start-2" : ""}`}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
