"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

import { isSamePageHref, isUnmodifiedPrimaryClick } from "@/lib/same-page-href";
import { scrollToPageTop } from "@/lib/scroll-to-page-top";

type SiteNavLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
};

export function SiteNavLink({ href, onClick, ...props }: SiteNavLinkProps) {
  const pathname = usePathname();

  return (
    <Link
      {...props}
      href={href}
      onClick={(event) => {
        if (isUnmodifiedPrimaryClick(event) && isSamePageHref(pathname, href)) {
          event.preventDefault();
          scrollToPageTop();
        }

        onClick?.(event);
      }}
    />
  );
}
