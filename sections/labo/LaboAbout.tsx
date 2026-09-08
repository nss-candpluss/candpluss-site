import { Container } from "@/components/ui/Container";
import { laboAboutContent } from "@/data/labo";
import { bodyText, sectionTitle62ClassName, uiText } from "@/lib/typography";
import { LaboAboutGallery } from "@/sections/labo/LaboAboutGallery";

export function LaboAbout() {
  const { title, label, bodyTitle, body, images } = laboAboutContent;

  return (
    <section
      data-header-theme="onLight"
      data-labo-about
      className="bg-[var(--background)] pt-[var(--container-y-top)] pb-[var(--container-y-bottom)]"
    >
      <Container>
        <div className="grid grid-cols-1 gap-y-0 min-[1025px]:grid-cols-2 min-[1025px]:grid-rows-[auto_auto_1fr] min-[1025px]:items-stretch min-[1025px]:gap-x-[calc(52px*var(--gap-scale-x))]">
          <div className="order-1 min-[1025px]:col-start-1 min-[1025px]:row-start-1">
            <p
              className={`font-ui-en font-medium text-[var(--foreground)] opacity-[0.65] ${uiText(18)}`}
            >
              {label}
            </p>
            <h2
              className={`mt-[calc(32px*var(--gap-scale-y))] font-heading text-[var(--foreground)] ${sectionTitle62ClassName}`}
            >
              {title}
            </h2>
          </div>

          <LaboAboutGallery
            images={images}
            className="order-2 mt-[calc(98px*var(--layout-scale-y))] aspect-[13/10] min-[1025px]:col-start-2 min-[1025px]:row-start-1 min-[1025px]:row-span-3 min-[1025px]:mt-0"
          />

          <p
            className={`order-3 mt-[calc(42px*var(--gap-scale-y))] font-body-ja font-bold text-[var(--foreground)] min-[1025px]:col-start-1 min-[1025px]:row-start-2 ${uiText(21)}`}
          >
            {bodyTitle}
          </p>

          <p
            className={`order-4 mt-[calc(42px*var(--gap-scale-y))] font-body-ja text-[var(--foreground)] min-[1025px]:col-start-1 min-[1025px]:row-start-3 ${bodyText(16)}`}
          >
            {body}
          </p>
        </div>
      </Container>
    </section>
  );
}
