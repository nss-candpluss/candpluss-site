import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { MaskedImage } from "@/components/ui/MaskedImage";
import { TextLinkContent, textLinkLayoutClassName } from "@/components/ui/TextLink";
import { conceptContent } from "@/data/concept";

export function ConceptFeatureLinks() {
  return (
    <section
      data-header-theme="onLight"
      className="bg-[var(--background)] pt-[var(--container-y-top)] pb-[var(--container-y-bottom)]"
    >
      <Container>
        <div className="grid grid-cols-1 gap-x-[calc(16px*var(--gap-scale-x))] gap-y-[calc(16px*var(--gap-scale-y))] min-[768px]:grid-cols-3">
          {conceptContent.featureLinks.map((item) => (
            <Link key={item.id} href={item.href} className="group block">
              <div className="relative overflow-hidden">
                <MaskedImage
                  src={item.image}
                  alt=""
                  aspectClassName="aspect-[4/3]"
                  containerClassName="overflow-hidden"
                  imageClassName="transition-transform duration-300 ease-out group-hover:scale-105"
                  sizes="(min-width: 768px) 33vw, 100vw"
                />
                <div className="absolute inset-0 bg-[rgba(0,0,0,0.15)]" aria-hidden="true" />
              </div>
              <span
                className={`mt-[calc(21px*var(--gap-scale-y))] text-[var(--foreground)] ${textLinkLayoutClassName}`}
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
