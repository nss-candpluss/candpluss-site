import type { ReactNode } from "react";

import type { LegalClause, LegalContact, LegalDocumentContent, LegalSection } from "@/types/legal";
import { bodyText, uiText } from "@/lib/typography";

const listClassName =
  "mt-[calc(16px*var(--gap-scale-y))] list-none space-y-[calc(12px*var(--gap-scale-y))]";

const sectionBodyClassName =
  "mt-[calc(24px*var(--gap-scale-y))] flex flex-col gap-[calc(16px*var(--gap-scale-y))]";

const pageTitleClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(18)}`;

const sectionHeadingClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(16)}`;

const bodyClassName = `font-body-ja text-[var(--foreground)] ${bodyText(15)}`;

function LegalBulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className={listClassName}>
      {items.map((item) => (
        <li key={item} className={bodyClassName}>
          ・{item}
        </li>
      ))}
    </ul>
  );
}

function LegalSectionLayout({
  title,
  titleAs,
  children,
}: {
  title: string;
  titleAs: "h1" | "h2";
  children: ReactNode;
}) {
  const Heading = titleAs;
  const headingClassName = titleAs === "h1" ? pageTitleClassName : sectionHeadingClassName;

  return (
    <section>
      <Heading className={headingClassName}>{title}</Heading>
      {children ? <div className={sectionBodyClassName}>{children}</div> : null}
    </section>
  );
}

function LegalClauseBlock({ clause }: { clause: LegalClause }) {
  return (
    <div>
      <p className={`${bodyClassName} whitespace-pre-line`}>{clause.text}</p>
      {clause.bullets?.length ? <LegalBulletList items={clause.bullets} /> : null}
    </div>
  );
}

function LegalContactBlock({ contact }: { contact: LegalContact }) {
  return (
    <div className="flex flex-col gap-[calc(8px*var(--gap-scale-y))]">
      {contact.address ? <p className={bodyClassName}>{contact.address}</p> : null}
      <p className={bodyClassName}>{contact.company}</p>
      {contact.phone ? <p className={bodyClassName}>電話番号：{contact.phone}</p> : null}
      {contact.fax ? <p className={bodyClassName}>FAX番号：{contact.fax}</p> : null}
      {contact.email ? <p className={bodyClassName}>Eメールアドレス：{contact.email}</p> : null}
    </div>
  );
}

function LegalSectionBlock({ section }: { section: LegalSection }) {
  return (
    <LegalSectionLayout title={section.title} titleAs="h2">
      {section.intro ? <p className={bodyClassName}>{section.intro}</p> : null}

      {section.body ? <p className={bodyClassName}>{section.body}</p> : null}

      {section.bullets?.length ? <LegalBulletList items={section.bullets} /> : null}

      {section.clauses?.map((clause) => (
        <LegalClauseBlock key={clause.text} clause={clause} />
      ))}

      {section.closing?.map((paragraph) => (
        <p key={paragraph} className={bodyClassName}>
          {paragraph}
        </p>
      ))}

      {section.contact ? <LegalContactBlock contact={section.contact} /> : null}
    </LegalSectionLayout>
  );
}

type LegalDocumentProps = {
  content: LegalDocumentContent;
};

export function LegalDocument({ content }: LegalDocumentProps) {
  return (
    <article className="mx-auto w-full max-w-[980px]">
      <div className="flex flex-col gap-[calc(52px*var(--gap-scale-y))]">
        <LegalSectionLayout title={content.title} titleAs="h1">
          {content.lead ? <p className={bodyClassName}>{content.lead}</p> : null}
        </LegalSectionLayout>

        {content.sections.map((section) => (
          <LegalSectionBlock key={section.title} section={section} />
        ))}

        {content.contact ? (
          <div className="flex flex-col gap-[calc(16px*var(--gap-scale-y))]">
            {content.contact.intro ? <p className={bodyClassName}>{content.contact.intro}</p> : null}
            <LegalContactBlock contact={content.contact} />
          </div>
        ) : null}

        <p className={bodyClassName}>{content.updatedAt}</p>
      </div>
    </article>
  );
}
