import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { MaskedImage } from "@/components/ui/MaskedImage";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { TextLink, TextLinkContent, textLinkLayoutClassName } from "@/components/ui/TextLink";
import { homeMainProducts } from "@/data/home";
import { standardCardSpanClassName } from "@/lib/layout";
import { sectionTitle62ClassName, uiTextRange } from "@/lib/typography";

export function HomeMainProducts() {
  return (
    <section
      data-header-theme="onLight"
      className="bg-[var(--background)] pt-[var(--container-y-top)] pb-[var(--container-y-bottom)]"
    >
      <Container>
        <h2 className={`font-heading text-[var(--foreground)] ${sectionTitle62ClassName}`}>
          {homeMainProducts.title}
        </h2>

        <SiteGrid className="mt-[var(--section-title-gap)] gap-[calc(32px*var(--gap-scale))]">
          {homeMainProducts.items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`group block ${standardCardSpanClassName}`}
            >
              <div className="relative">
                <MaskedImage
                  src={item.image}
                  alt=""
                  aspectClassName="aspect-[4/5]"
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  imageClassName="transition-transform duration-300 ease-out group-hover:scale-105"
                />
                <div
                  className="absolute inset-0 bg-[rgba(0,0,0,0.15)]"
                  aria-hidden="true"
                />
                <span
                  className={`absolute bottom-5 right-5 text-white md:bottom-8 md:right-8 ${textLinkLayoutClassName}`}
                >
                  <TextLinkContent>{item.title}</TextLinkContent>
                </span>
              </div>
              <p
                className={`mt-[calc(16px*var(--gap-scale-y))] font-ui-en text-[var(--color-muted)] ${uiTextRange("13-14")}`}
              >
                {item.caption}
              </p>
            </Link>
          ))}
        </SiteGrid>

        <div className="mt-[calc(60px*var(--gap-scale-y))]">
          <TextLink href={homeMainProducts.link.href}>
            {homeMainProducts.link.label}
          </TextLink>
        </div>
      </Container>
    </section>
  );
}
