import type { ReactNode } from "react";

import { contactFormCopy } from "@/data/contact";
import { uiText } from "@/lib/typography";
import {
  contactErrorClassName,
  contactFormRowClassName,
} from "@/sections/contact/contactStyles";

type ContactFieldProps = {
  label: string;
  requirement: "required" | "optional";
  htmlFor?: string;
  anchorId?: string;
  note?: string | readonly string[];
  error?: string;
  children: ReactNode;
};

const labelClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(16)}`;

const requirementClassName = `shrink-0 font-body-ja text-[var(--color-muted)] ${uiText(13)}`;

const noteClassName = `mt-[calc(8px*var(--gap-scale-y))] font-body-ja text-[var(--color-muted)] ${uiText(13)}`;

export function ContactField({
  label,
  requirement,
  htmlFor,
  anchorId,
  note,
  error,
  children,
}: ContactFieldProps) {
  const requirementLabel = contactFormCopy.requirementLabels[requirement];

  return (
    <div
      id={anchorId}
      className={`${contactFormRowClassName}${anchorId ? " scroll-mt-[calc(var(--header-height)+16px)]" : ""}`}
    >
      <div className="flex items-start justify-between gap-x-[calc(16px*var(--gap-scale-x))] gap-y-[calc(8px*var(--gap-scale-y))]">
        {htmlFor ? (
          <label htmlFor={htmlFor} className={labelClassName}>
            {label}
          </label>
        ) : (
          <p className={labelClassName}>{label}</p>
        )}
        <span className={requirementClassName}>{requirementLabel}</span>
      </div>

      <div className="mt-[calc(16px*var(--gap-scale-y))]">{children}</div>

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

      {error ? <p className={contactErrorClassName}>{error}</p> : null}
    </div>
  );
}
