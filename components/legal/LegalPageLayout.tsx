import type { ReactNode } from "react";

import { Container } from "@/components/ui/Container";

type LegalPageLayoutProps = {
  children: ReactNode;
};

export function LegalPageLayout({ children }: LegalPageLayoutProps) {
  return (
    <main
      data-header-theme="onLight"
      className="bg-white pt-[calc(var(--header-height)+144px*var(--layout-scale-y))] pb-[var(--container-y-bottom)] text-[var(--foreground)]"
    >
      <Container>{children}</Container>
    </main>
  );
}
