import { describe, expect, it } from "vitest";

import { featureLinkImages } from "@/data/feature-link-images";
import { homeFeatureLinks } from "@/data/home";

describe("home feature links", () => {
  it("keeps shared feature-link images in public/images/common", () => {
    expect(featureLinkImages).toEqual({
      products: "/images/common/link-products.webp",
      labo: "/images/common/link-labo.webp",
      support: "/images/common/link-support.webp",
    });
  });

  it("uses the shared LABO and SUPPORT link images", () => {
    expect(homeFeatureLinks.map((item) => item.title)).toEqual(["LABO", "SUPPORT"]);
    expect(homeFeatureLinks.map((item) => item.href)).toEqual(["/labo", "/support"]);
    expect(homeFeatureLinks.find((item) => item.id === "labo")?.image).toBe(
      featureLinkImages.labo
    );
    expect(homeFeatureLinks.find((item) => item.id === "support")?.image).toBe(
      featureLinkImages.support
    );
  });
});
