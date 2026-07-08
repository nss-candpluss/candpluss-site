import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { MaskedImage } from "@/components/ui/MaskedImage";
import { TextLinkContent, textLinkLayoutClassName } from "@/components/ui/TextLink";
import { homeFeatureLinks } from "@/data/home";

export function HomeFeatureLinks() {
  return (
    <section data-header-theme="onLight" className="bg-[var(--background)] pt-[var(--container-y-top)] pb-[var(--container-y-bottom)]">
      <Container>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-[var(--feature-links-gap)]">
          {homeFeatureLinks.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group relative block"
            >
              <MaskedImage
                src={item.image}
                alt=""
                aspectClassName="aspect-[13/10]"
                sizes="(min-width: 768px) 50vw, 100vw"
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
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
