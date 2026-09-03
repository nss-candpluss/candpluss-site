import type { ReactNode } from "react";

import { siteGridClassName } from "@/lib/layout";

type SiteGridProps = {
  children: ReactNode;
  className?: string;
};

export function SiteGrid({ children, className = "" }: SiteGridProps) {
  return (
    <div className={`${siteGridClassName} ${className}`.trim()}>
      {children}
    </div>
  );
}
