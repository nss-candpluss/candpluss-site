export const CONCEPT_BACKGROUND_IMAGE_WIDTH = 2880;
export const CONCEPT_BACKGROUND_IMAGE_HEIGHT = 3600;

export const CONCEPT_BACKGROUND_LAYERS = [
  {
    key: "sky",
    src: "/images/concept/concept-bg-sky.webp",
    width: CONCEPT_BACKGROUND_IMAGE_WIDTH,
    height: CONCEPT_BACKGROUND_IMAGE_HEIGHT,
    zIndex: 0,
    priority: true,
    wrapperClassName: "w-[110vw]",
  },
  {
    key: "mountainBack",
    src: "/images/concept/concept-bg-mountain-back.webp",
    width: CONCEPT_BACKGROUND_IMAGE_WIDTH,
    height: CONCEPT_BACKGROUND_IMAGE_HEIGHT,
    zIndex: 1,
    priority: true,
    wrapperClassName: "w-screen",
  },
  {
    key: "mountainMiddle",
    src: "/images/concept/concept-bg-mountain-middle.webp",
    width: CONCEPT_BACKGROUND_IMAGE_WIDTH,
    height: CONCEPT_BACKGROUND_IMAGE_HEIGHT,
    zIndex: 2,
    priority: true,
    wrapperClassName: "w-screen",
  },
  {
    key: "hill",
    src: "/images/concept/concept-bg-hill.webp",
    width: CONCEPT_BACKGROUND_IMAGE_WIDTH,
    height: CONCEPT_BACKGROUND_IMAGE_HEIGHT,
    zIndex: 3,
    priority: true,
    wrapperClassName: "w-screen",
  },
  {
    key: "grass",
    src: "/images/concept/concept-bg-grass.webp",
    width: CONCEPT_BACKGROUND_IMAGE_WIDTH,
    height: CONCEPT_BACKGROUND_IMAGE_HEIGHT,
    zIndex: 4,
    priority: true,
    wrapperClassName: "w-screen",
  },
] as const;

export type ConceptBackgroundLayerKey = (typeof CONCEPT_BACKGROUND_LAYERS)[number]["key"];
