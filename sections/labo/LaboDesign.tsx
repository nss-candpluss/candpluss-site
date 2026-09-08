import { SiteImage } from "@/components/ui/SiteImage";
import { Container } from "@/components/ui/Container";
import { laboDesignContent } from "@/data/labo";
import { bodyText, sectionTitle62ClassName, uiText } from "@/lib/typography";

export function LaboDesign() {
  const { title, label, body, image } = laboDesignContent;

  return (
    <section
      data-header-theme="onDark"
      data-labo-design
      className="bg-black pt-[var(--container-y-top)] pb-[var(--container-y-bottom)] text-white"
    >
      <Container>
        <div className="grid grid-cols-1 gap-y-0 min-[1025px]:grid-cols-2 min-[1025px]:grid-rows-[auto_1fr] min-[1025px]:items-stretch min-[1025px]:gap-x-[calc(52px*var(--gap-scale-x))]">
          <div className="order-1 min-[1025px]:col-start-1 min-[1025px]:row-start-1">
            <p className={`font-ui-en font-medium opacity-[0.65] ${uiText(18)}`}>
              {label}
            </p>
            <h2
              className={`mt-[calc(32px*var(--gap-scale-y))] font-heading ${sectionTitle62ClassName}`}
            >
              {title}
            </h2>
          </div>

          <figure className="relative order-2 mt-[calc(98px*var(--layout-scale-y))] aspect-[13/10] overflow-hidden min-[1025px]:col-start-2 min-[1025px]:row-start-1 min-[1025px]:row-span-2 min-[1025px]:mt-0">
            <SiteImage
              src={image}
              alt=""
              fill
              sizes="(min-width: 1025px) 50vw, 100vw"
              className="object-cover object-center"
            />
          </figure>

          <p
            className={`order-3 mt-[calc(42px*var(--gap-scale-y))] font-body-ja min-[1025px]:col-start-1 min-[1025px]:row-start-2 ${bodyText(16)}`}
          >
            {body}
          </p>
        </div>
      </Container>
    </section>
  );
}
