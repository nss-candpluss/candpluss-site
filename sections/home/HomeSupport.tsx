import { SiteImage } from "@/components/ui/SiteImage";

import { Container } from "@/components/ui/Container";
import { TextLink } from "@/components/ui/TextLink";
import { homeSupportContent } from "@/data/home";
import { bodyText, sectionTitle62ClassName, uiText } from "@/lib/typography";

export function HomeSupport() {
  return (
    <section
      data-header-theme="onLight"
      className="pt-[var(--container-y-top)] pb-[var(--container-y-bottom)]"
    >
      <Container>
        <div className="grid grid-cols-1 gap-y-0 min-[1024px]:grid-cols-2 min-[1024px]:grid-rows-[auto_auto_1fr_auto] min-[1024px]:items-stretch min-[1024px]:gap-x-[calc(52px*var(--gap-scale-x))]">
          <h2
            className={`order-1 font-heading text-[var(--foreground)] min-[1024px]:col-start-1 min-[1024px]:row-start-1 ${sectionTitle62ClassName}`}
          >
            {homeSupportContent.heading}
          </h2>

          <figure className="relative order-2 mt-[calc(98px*var(--layout-scale-y))] aspect-[13/10] overflow-hidden min-[1024px]:col-start-2 min-[1024px]:row-start-1 min-[1024px]:row-span-4 min-[1024px]:mt-0">
            <SiteImage
              src={homeSupportContent.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-center"
            />
          </figure>

          <p
            className={`order-3 mt-[calc(46px*var(--gap-scale-y))] font-body-ja font-bold text-[var(--foreground)] min-[1024px]:col-start-1 min-[1024px]:row-start-2 min-[1024px]:mt-[calc(98px*var(--layout-scale-y))] ${uiText(21)}`}
          >
            {homeSupportContent.label}
          </p>

          <p
            className={`order-4 font-body-ja text-[var(--foreground)] mt-[calc(42px*var(--gap-scale-y))] min-[1024px]:col-start-1 min-[1024px]:row-start-3 ${bodyText(16)} whitespace-pre-line`}
          >
            {homeSupportContent.body}
          </p>

          <div className="order-5 mt-[calc(60px*var(--gap-scale-y))] min-[1024px]:col-start-1 min-[1024px]:row-start-4 min-[1024px]:self-end">
            <TextLink href={homeSupportContent.link.href}>
              {homeSupportContent.link.label}
            </TextLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
