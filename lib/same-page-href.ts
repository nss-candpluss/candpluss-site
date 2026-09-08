import { normalizePathname } from "@/lib/header-theme";

export function hrefPathname(href: string): string {
  const path = href.split(/[?#]/, 1)[0] ?? href;
  return normalizePathname(path);
}

export function isSamePageHref(pathname: string, href: string): boolean {
  return normalizePathname(pathname) === hrefPathname(href);
}

export function isUnmodifiedPrimaryClick(event: {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}
