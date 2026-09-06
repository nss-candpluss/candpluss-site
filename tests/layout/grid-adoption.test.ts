import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function source(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("12 column grid adoption", () => {
  it("uses standard card spans for Home and News listings", () => {
    for (const path of ["sections/home/HomeNews.tsx", "app/news/page.tsx"]) {
      const fileSource = source(path);

      expect(fileSource).toContain("SiteGrid");
      expect(fileSource).toContain("standardCardSpanClassName");
    }
  });

  it("switches Main Products between two- and three-column spans by item count", () => {
    const fileSource = source("sections/home/HomeMainProducts.tsx");

    expect(fileSource).toContain("SiteGrid");
    expect(fileSource).toContain("mainProductCardSpanClassName");
    expect(fileSource).toContain("mainProductCardAspectClassName");
    expect(fileSource).toContain("gap-y-[calc(62px*var(--gap-scale-y))]");
    expect(fileSource).toContain("min-[768px]:gap-y-[calc(32px*var(--gap-scale))]");
  });

  it("keeps the Products listing breakpoints and breakout navigation", () => {
    const fileSource = source("components/products/ProductsListing.tsx");

    expect(fileSource).toContain("SiteGrid");
    expect(fileSource).toContain("productCardSpanClassName");
    expect(fileSource).toContain("-mx-[var(--container-x)]");
    expect(fileSource).toContain("overflow-x-auto");
  });

  it("uses dedicated two- and three-column FeatureLink spans", () => {
    expect(source("sections/home/HomeFeatureLinks.tsx")).toContain(
      "twoColumnFeatureSpanClassName"
    );

    for (const path of [
      "sections/concept/ConceptFeatureLinks.tsx",
      "sections/quality/QualityFeatureLinks.tsx",
    ]) {
      const fileSource = source(path);

      expect(fileSource).toContain("SiteGrid");
      expect(fileSource).toContain("threeColumnFeatureSpanClassName");
    }
  });

  it("connects Legal, Contact, and Company pages to full-span grid shells", () => {
    for (const path of [
      "components/legal/LegalPageLayout.tsx",
      "app/contact/page.tsx",
      "app/contact/confirm/page.tsx",
      "app/contact/thanks/page.tsx",
      "app/company/page.tsx",
    ]) {
      const fileSource = source(path);

      expect(fileSource).toContain("SiteGrid");
      expect(fileSource).toContain("fullSpanClassName");
    }
  });

  it("uses 6+6 form rows and 3+9 definition rows", () => {
    expect(source("sections/contact/ContactForm.tsx")).toContain(
      "formHalfSpanClassName"
    );
    expect(source("sections/contact/ContactConfirm.tsx")).toContain(
      "formHalfSpanClassName"
    );

    for (const path of [
      "components/company/CompanyDocument.tsx",
      "components/legal/CommercialTransactionsDocument.tsx",
    ]) {
      const fileSource = source(path);

      expect(fileSource).toContain("definitionLabelSpanClassName");
      expect(fileSource).toContain("definitionValueSpanClassName");
    }
  });
});
