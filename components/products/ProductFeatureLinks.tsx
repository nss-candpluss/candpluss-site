import Link from "next/link";

import { HoverUnderlineText } from "@/components/ui/TextLink";
import { arrowMaskStyle } from "@/lib/maskStyle";
import { uiText } from "@/lib/typography";

type ProductFeatureLink = {
  label: string;
  href?: string;
};

type ProductFeatureLinksProps = {
  links: ProductFeatureLink[];
};

function FeatureLinkContent({ label }: { label: string }) {
  return (
    <>
      <span
        aria-hidden="true"
        className="my-auto size-[calc(20px*var(--text-scale))] shrink-0 bg-current"
        style={arrowMaskStyle}
      />
      <HoverUnderlineText variant="groupHover">{label}</HoverUnderlineText>
    </>
  );
}

const featureLinkClassName = `inline-flex items-center gap-[calc(8px*var(--gap-scale-x))] font-body-ja font-semibold text-[var(--foreground)] ${uiText(15)}`;

export function ProductFeatureLinks({ links }: ProductFeatureLinksProps) {
  if (!links.length) {
    return null;
  }

  return (
    <ul className="mt-[calc(24px*var(--gap-scale-y))] flex flex-col items-start gap-[calc(12px*var(--gap-scale-y))]">
      {links.map((link, index) => (
        <li key={`${link.href ?? "pending"}-${link.label}-${index}`}>
          {link.href ? (
            <Link href={link.href} className={`group ${featureLinkClassName}`}>
              <FeatureLinkContent label={link.label} />
            </Link>
          ) : (
            <span className={featureLinkClassName}>
              <span
                aria-hidden="true"
                className="my-auto size-[calc(20px*var(--text-scale))] shrink-0 bg-current"
                style={arrowMaskStyle}
              />
              {link.label}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
