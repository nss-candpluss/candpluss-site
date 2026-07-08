export type ConceptLayerMotionKey =
  | "mountainBack"
  | "mountainMiddle"
  | "hill"
  | "grass";

export type ConceptBackgroundMotionConfig = {
  sky: {
    xStart: number;
    xEnd: number;
    yStart: number;
    yEnd: number;
  };
  layers: ReadonlyArray<{
    key: ConceptLayerMotionKey;
    yStart: number;
    yEnd: number;
  }>;
};

/** 1024px 以上 */
export const CONCEPT_BACKGROUND_MOTION_DESKTOP: ConceptBackgroundMotionConfig = {
  sky: { xStart: 0, xEnd: 80, yStart: 0, yEnd: 0 },
  layers: [
    { key: "mountainBack", yStart: 300, yEnd: -460 },
    { key: "mountainMiddle", yStart: 210, yEnd: -490 },
    { key: "hill", yStart: 160, yEnd: -460 },
    { key: "grass", yStart: 160, yEnd: -300 },
  ],
};

/** 1023px 以下 */
export const CONCEPT_BACKGROUND_MOTION_MOBILE: ConceptBackgroundMotionConfig = {
  sky: { xStart: 10, xEnd: 70, yStart: 0, yEnd: 0 },
  layers: [
    { key: "mountainBack", yStart: 4200, yEnd: 378 },
    { key: "mountainMiddle", yStart: 4200, yEnd: 378 },
    { key: "hill", yStart: 4200, yEnd: 378 },
    { key: "grass", yStart: 4200, yEnd: 378 },
  ],
};

export function getConceptBackgroundMotion(): ConceptBackgroundMotionConfig {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1024px)").matches
  ) {
    return CONCEPT_BACKGROUND_MOTION_DESKTOP;
  }

  return CONCEPT_BACKGROUND_MOTION_MOBILE;
}
