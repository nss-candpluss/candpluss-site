import { describe, expect, it } from "vitest";

import { homeFeatureLinks } from "@/data/home";

describe("home feature links", () => {
  it("uses dummy LABO image and the shared SUPPORT link image", () => {
    expect(homeFeatureLinks.map((item) => item.title)).toEqual(["LABO", "SUPPORT"]);
    expect(homeFeatureLinks.map((item) => item.href)).toEqual(["/labo", "/support"]);
    expect(homeFeatureLinks.find((item) => item.id === "labo")?.image).toContain(
      "placeholder"
    );
    expect(homeFeatureLinks.find((item) => item.id === "support")?.image).toBe(
      "/images/common/link-support.webp"
    );
  });
});
