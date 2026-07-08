import { contactPageContent } from "@/data/contact";
import { bodyText, sectionTitle62ClassName, uiText } from "@/lib/typography";

const sectionHeadingClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(16)}`;

const bodyClassName = `font-body-ja text-[var(--foreground)] ${bodyText(15)}`;

const phoneNumberClassName = `font-body-ja text-[var(--foreground)] ${uiText(18)}`;

type ContactHeroProps = {
  title?: string;
  showIntro?: boolean;
};

export function ContactHero({
  title = contactPageContent.title,
  showIntro = true,
}: ContactHeroProps) {
  const { phoneSection, introParagraphs, mailDomainNote } = contactPageContent;

  return (
    <>
      <h1 className={`font-heading text-[var(--foreground)] ${sectionTitle62ClassName}`}>{title}</h1>

      {showIntro ? (
        <>
          <section className="mt-[calc(98px*var(--layout-scale-y))]">
            <h2 className={sectionHeadingClassName}>{phoneSection.heading}</h2>
            <p className={`mt-[calc(16px*var(--gap-scale-y))] ${phoneNumberClassName}`}>
              {phoneSection.phoneNumber}
            </p>
            <p className={`mt-[calc(8px*var(--gap-scale-y))] ${bodyClassName}`}>{phoneSection.hours}</p>
          </section>

          <div
            className={`mt-[calc(48px*var(--gap-scale-y))] flex flex-col gap-[calc(24px*var(--gap-scale-y))] ${bodyClassName}`}
          >
            {introParagraphs.map((paragraph) => (
              <p key={paragraph}>
                {paragraph.includes(mailDomainNote) ? (
                  <>
                    {paragraph.split(mailDomainNote)[0]}
                    <span className="font-semibold">{mailDomainNote}</span>
                    {paragraph.split(mailDomainNote)[1]}
                  </>
                ) : (
                  paragraph
                )}
              </p>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
