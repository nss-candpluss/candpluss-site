import { describe, expect, it } from "vitest";

import { homeFeatureLinks } from "@/data/home";

describe("home feature links", () => {
  it("uses dummy LABO and SUPPORT image links", () => {
    expect(homeFeatureLinks.map((item) => item.title)).toEqual(["LABO", "SUPPORT"]);
    expect(homeFeatureLinks.map((item) => item.href)).toEqual(["/labo", "/support"]);
    expect(homeFeatureLinks.every((item) => item.image.includes("placeholder"))).toBe(true);
  });
});
