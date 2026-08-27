import { describe, expect, it } from "vitest";

import { normalizeProductHandle } from "@/lib/products/helpers";

describe("normalizeProductHandle", () => {
  it("decodes percent-encoded Japanese handles used in product URLs", () => {
    expect(normalizeProductHandle("%E3%83%AB%E3%83%BC%E3%83%95%E3%82%B7%E3%83%BC%E3%83%88")).toBe(
      "ルーフシート"
    );
  });

  it("keeps already-decoded handles unchanged", () => {
    expect(normalizeProductHandle("ルーフシート")).toBe("ルーフシート");
    expect(normalizeProductHandle("moya500")).toBe("moya500");
  });
});
