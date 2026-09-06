"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";

import { Container } from "@/components/ui/Container";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { conceptSectionNavSpanClassName } from "@/lib/layout";
import { isLenisBound } from "@/lib/motion/setup-lenis-scroll-trigger";
import { uiTextRange } from "@/lib/typography";

type ConceptSectionNavItem = {
  id: string;
  title: string;
};

type ConceptSectionNavProps = {
  sections: readonly ConceptSectionNavItem[];
};

function resolveActiveSectionId(sectionIds: readonly string[]): string {
  const firstId = sectionIds[0] ?? "";
  const marker = window.scrollY + window.innerHeight * 0.35;
  let currentId = firstId;

  for (const sectionId of sectionIds) {
    const element = document.getElementById(sectionId);
    if (!element) {
      continue;
    }

    const sectionTop = element.getBoundingClientRect().top + window.scrollY;
    if (marker >= sectionTop) {
      currentId = sectionId;
    }
  }

  return currentId;
}

export function ConceptSectionNav({ sections }: ConceptSectionNavProps) {
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const sectionIds = sections.map((section) => section.id);

    function updateActiveSection() {
      setActiveSectionId(resolveActiveSectionId(sectionIds));
    }

    const frameId = window.requestAnimationFrame(updateActiveSection);

    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [sections]);

  const handleClick = useCallback((event: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (!target || !isLenisBound()) {
      return;
    }

    event.preventDefault();
    setActiveSectionId(sectionId);

    window.history.pushState(null, "", `#${sectionId}`);
  }, []);

  return (
    <nav
      aria-label="Concept sections"
      className="pointer-events-none absolute inset-0 z-20 hidden min-[1025px]:block"
    >
      <Container className="h-full">
        <SiteGrid className="h-full">
          <div className={`${conceptSectionNavSpanClassName} h-full`}>
            <div className="sticky top-0 flex h-svh items-center">
              <ul className="flex flex-col gap-[calc(16px*var(--gap-scale-y))]">
                {sections.map((section) => {
                  const isActive = activeSectionId === section.id;

                  return (
                    <li
                      key={section.id}
                      data-concept-intro-menu-item
                      className="pointer-events-auto"
                      style={{ opacity: 0, transform: "translateY(12px)" }}
                    >
                      <a
                        href={`#${section.id}`}
                        aria-current={isActive ? "location" : undefined}
                        onClick={(event) => handleClick(event, section.id)}
                        className={`whitespace-nowrap font-ui-en font-medium text-white ${uiTextRange("14-16")} transition-opacity duration-200 ${
                          isActive ? "opacity-100" : "opacity-45 hover:opacity-100"
                        }`}
                      >
                        {section.title}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </SiteGrid>
      </Container>
    </nav>
  );
}
