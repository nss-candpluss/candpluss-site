"use client";

import { TextLink } from "@/components/ui/TextLink";
import { errorPageContent } from "@/data/error-pages";
import { arrowMaskStyle } from "@/lib/maskStyle";
import { uiText } from "@/lib/typography";
import { ErrorPageBody } from "@/sections/error/ErrorPageBody";

type ErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function Error({ retry }: ErrorProps) {
  return (
    <ErrorPageBody
      title={errorPageContent.title}
      body={errorPageContent.body}
      actions={
        <>
          <button
            type="button"
            onClick={() => retry()}
            className={`group font-ui-en inline-flex cursor-pointer items-center gap-x-[calc(8px*var(--gap-scale-x))] font-medium ${uiText(18)}`}
          >
            <span
              aria-hidden="true"
              className="size-[calc(24px*var(--text-scale))] shrink-0 bg-current"
              style={arrowMaskStyle}
            />
            {errorPageContent.retryLabel}
          </button>

          {errorPageContent.links.map((link) => (
            <TextLink key={link.href} href={link.href}>
              {link.label}
            </TextLink>
          ))}
        </>
      }
    />
  );
}
