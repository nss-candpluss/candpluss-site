import { Container } from "@/components/ui/Container";
import { MaskedImage } from "@/components/ui/MaskedImage";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { laboActivitiesContent } from "@/data/labo";
import { standardCardSpanClassName } from "@/lib/layout";
import { bodyText, sectionTitle62ClassName, uiText } from "@/lib/typography";

export function LaboActivities() {
  const { title, label, items } = laboActivitiesContent;

  return (
    <section
      data-header-theme="onLight"
      data-labo-activities
      className="bg-[#f5f5f5] pt-[var(--container-y-top)] pb-[var(--container-y-bottom)]"
    >
      <Container>
        <div>
          <p
            className={`font-ui-en font-medium text-[var(--foreground)] opacity-[0.65] ${uiText(18)}`}
          >
            {label}
          </p>
          <h2
            className={`mt-[calc(32px*var(--gap-scale-y))] font-heading ${sectionTitle62ClassName} text-[var(--foreground)]`}
          >
            {title}
          </h2>
        </div>

        <SiteGrid className="mt-[calc(98px*var(--layout-scale-y))] gap-x-[calc(16px*var(--gap-scale-x))] gap-y-[calc(62px*var(--gap-scale-y))] min-[1025px]:gap-y-[calc(16px*var(--gap-scale-y))]">
          {items.map((item) => (
            <article key={item.id} className={standardCardSpanClassName}>
              <MaskedImage
                src={item.image}
                alt=""
                aspectClassName="aspect-[13/10]"
                containerClassName="bg-[var(--color-line)]"
                sizes="(min-width: 768px) 33vw, 100vw"
              />

              <div className="mt-[calc(22px*var(--gap-scale-y))] flex flex-col px-[calc(8px*var(--gap-scale-x))]">
                <h3
                  className={`min-w-0 font-body-ja font-bold text-[var(--foreground)] ${uiText(16)}`}
                >
                  {item.title}
                </h3>
                <p
                  className={`mt-[calc(15px*var(--gap-scale-y))] font-body-ja text-[var(--foreground)] ${bodyText(15)}`}
                >
                  {item.body}
                </p>
              </div>
            </article>
          ))}
        </SiteGrid>
      </Container>
    </section>
  );
}
