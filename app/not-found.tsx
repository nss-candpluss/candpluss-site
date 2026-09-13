import type { Metadata } from "next";

import { TextLink } from "@/components/ui/TextLink";
import { notFoundContent } from "@/data/error-pages";
import { ErrorPageBody } from "@/sections/error/ErrorPageBody";

/**
 * 存在しない URL なので canonical は持たせない。
 * robots は指定しない（Next.js が 404 に noindex を自動注入するため、
 * ここで指定すると robots meta が重複する）。
 */
export const metadata: Metadata = {
  title: notFoundContent.title,
  description: notFoundContent.body.join(" "),
};

export default function NotFound() {
  return (
    <ErrorPageBody
      code={notFoundContent.code}
      title={notFoundContent.title}
      body={notFoundContent.body}
      actions={notFoundContent.links.map((link) => (
        <TextLink key={link.href} href={link.href}>
          {link.label}
        </TextLink>
      ))}
    />
  );
}
