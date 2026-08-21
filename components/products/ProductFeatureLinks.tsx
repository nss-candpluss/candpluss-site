import Link from "next/link";

import { HoverUnderlineText } from "@/components/ui/TextLink";
import { arrowMaskStyle } from "@/lib/maskStyle";
import { uiText } from "@/lib/typography";

type ProductFeatureLinksProps = {
  links: Array<{
    label: string;
    href: string;
  }>;
};

export function ProductFeatureLinks({ links }: ProductFeatureLinksProps) {
  if (!links.length) {
    return null;
  }

  return (
    <ul className="mt-[calc(18px*var(--gap-scale-y))] flex flex-col items-start gap-[calc(12px*var(--gap-scale-y))]">
      {links.map((link, index) => (
        <li key={`${link.href}-${link.label}-${index}`}>
          <Link
            href={link.href}
            className={`group inline-flex items-center gap-[calc(8px*var(--gap-scale-x))] font-body-ja font-semibold text-[var(--foreground)] ${uiText(15)}`}
          >
            <span
              aria-hidden="true"
              className="my-auto size-[calc(20px*var(--text-scale))] shrink-0 bg-current"
              style={arrowMaskStyle}
            />
            <HoverUnderlineText variant="groupHover">{link.label}</HoverUnderlineText>
          </Link>
        </li>
      ))}
    </ul>
  );
}
