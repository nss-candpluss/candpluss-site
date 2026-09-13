import { TextLink } from "@/components/ui/TextLink";
import { notFoundContent } from "@/data/error-pages";
import { ErrorPageBody } from "@/sections/error/ErrorPageBody";

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
