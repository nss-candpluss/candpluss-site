import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { MaskedImage } from "@/components/ui/MaskedImage";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { TextLink, TextLinkContent, textLinkLayoutClassName } from "@/components/ui/TextLink";
import { homeMainProducts } from "@/data/home";
import {
  MAIN_PRODUCTS_THREE_COLUMN_MIN_COUNT,
  mainProductCardAspectClassName,
  mainProductCardSpanClassName,
} from "@/lib/layout";
import { sectionTitle62ClassName, uiText } from "@/lib/typography";

const MAIN_PRODUCT_COUNT = homeMainProducts.items.length;
const MAIN_PRODUCT_CARD_SPAN_CLASS_NAME =
  mainProductCardSpanClassName(MAIN_PRODUCT_COUNT);
const MAIN_PRODUCT_IMAGE_ASPECT_CLASS_NAME =
  mainProductCardAspectClassName(MAIN_PRODUCT_COUNT);
const MAIN_PRODUCT_IMAGE_SIZES =
  MAIN_PRODUCT_COUNT >= MAIN_PRODUCTS_THREE_COLUMN_MIN_COUNT
    ? "(min-width: 1025px) 33vw, (min-width: 768px) 50vw, 100vw"
    : "(min-width: 768px) 50vw, 100vw";

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

        <SiteGrid className="mt-[var(--section-title-gap)] gap-x-[calc(32px*var(--gap-scale-x))] gap-y-[calc(62px*var(--gap-scale-y))] min-[768px]:gap-y-[calc(32px*var(--gap-scale))]">
          {homeMainProducts.items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`group block ${MAIN_PRODUCT_CARD_SPAN_CLASS_NAME}`}
            >
              <div className="relative">
                <MaskedImage
                  src={item.image}
                  alt=""
                  aspectClassName={MAIN_PRODUCT_IMAGE_ASPECT_CLASS_NAME}
                  sizes={MAIN_PRODUCT_IMAGE_SIZES}
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
                className={`mt-[calc(16px*var(--gap-scale-y))] font-ui-en text-[var(--color-muted)] ${uiText(14)}`}
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
