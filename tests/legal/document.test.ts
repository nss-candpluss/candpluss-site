import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { commercialTransactionsContent } from "@/data/legal/commercialTransactions";
import { cookiePolicyContent } from "@/data/legal/cookiePolicy";
import { privacyPolicyContent } from "@/data/legal/privacyPolicy";
import { termsContent } from "@/data/legal/terms";
import { shoppingGuideContent } from "@/data/shoppingGuide";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function source(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function collectCopy(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectCopy);
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectCopy);
  }

  return [];
}

const documentPaths = [
  "components/legal/LegalDocument.tsx",
  "components/legal/CommercialTransactionsDocument.tsx",
  "components/shopping-guide/ShoppingGuideDocument.tsx",
] as const;

describe("legal documents", () => {
  it("does not render a last-updated date", () => {
    for (const path of documentPaths) {
      expect(source(path)).not.toContain("updatedAt");
    }
  });

  it("spaces body blocks with margin instead of flex gap", () => {
    for (const path of documentPaths) {
      const fileSource = source(path);

      expect(fileSource).toContain("space-y-[calc(16px*var(--gap-scale-y))]");
      expect(fileSource).toContain("space-y-[calc(52px*var(--gap-scale-y))]");
      expect(fileSource).not.toContain("gap-[calc(16px*var(--gap-scale-y))]");
      expect(fileSource).not.toContain("gap-[calc(52px*var(--gap-scale-y))]");
    }
  });

  it("uses full-width parentheses and brackets in legal and shopping-guide copy", () => {
    const contents = [
      termsContent,
      privacyPolicyContent,
      cookiePolicyContent,
      commercialTransactionsContent,
      shoppingGuideContent,
    ];

    for (const content of contents) {
      for (const text of collectCopy(content)) {
        if (/^https?:\/\//.test(text) || text.startsWith("/")) {
          continue;
        }

        expect(text).not.toMatch(/[()\[\]]/);
      }
    }
  });
});
