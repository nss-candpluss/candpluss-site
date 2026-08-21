import { describe, expect, it } from "vitest";

import { splitFeatureNotes } from "@/lib/products/feature-notes";

describe("splitFeatureNotes", () => {
  it("moves ※ lines below the body", () => {
    expect(
      splitFeatureNotes(
        "アルミ製三角自在を標準装備。\n※ 同梱されている三角自在金具は9個です"
      )
    ).toEqual({
      body: "アルミ製三角自在を標準装備。",
      notes: ["※ 同梱されている三角自在金具は9個です"],
    });
  });

  it("keeps a body without notes unchanged", () => {
    expect(splitFeatureNotes("本文だけです。")).toEqual({
      body: "本文だけです。",
      notes: [],
    });
  });
});
