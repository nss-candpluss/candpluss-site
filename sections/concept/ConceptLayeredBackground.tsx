import { SiteImage } from "@/components/ui/SiteImage";
import type { RefObject } from "react";

import {
  CONCEPT_BACKGROUND_LAYERS,
  type ConceptBackgroundLayerKey,
} from "@/data/concept-background";

type ConceptLayeredBackgroundProps = {
  skyRef: RefObject<HTMLDivElement | null>;
  mountainBackRef: RefObject<HTMLDivElement | null>;
  mountainMiddleRef: RefObject<HTMLDivElement | null>;
  hillRef: RefObject<HTMLDivElement | null>;
  grassRef: RefObject<HTMLDivElement | null>;
};

const layerRefMap: Record<
  ConceptBackgroundLayerKey,
  keyof ConceptLayeredBackgroundProps
> = {
  sky: "skyRef",
  mountainBack: "mountainBackRef",
  mountainMiddle: "mountainMiddleRef",
  hill: "hillRef",
  grass: "grassRef",
};

const layerPositionClassName = "absolute left-1/2 top-0 -translate-x-1/2";
const layerMotionClassName = "will-change-transform";

export function ConceptLayeredBackground({
  skyRef,
  mountainBackRef,
  mountainMiddleRef,
  hillRef,
  grassRef,
}: ConceptLayeredBackgroundProps) {
  const refs: ConceptLayeredBackgroundProps = {
    skyRef,
    mountainBackRef,
    mountainMiddleRef,
    hillRef,
    grassRef,
  };

  return (
    <div className="pointer-events-none absolute inset-0 bg-[#1a2430]" aria-hidden="true">
      {CONCEPT_BACKGROUND_LAYERS.map((layer) => (
        <div
          key={layer.key}
          className={`${layerPositionClassName} ${layer.wrapperClassName}`}
          style={{ zIndex: layer.zIndex }}
        >
          <div ref={refs[layerRefMap[layer.key]]} className={layerMotionClassName}>
            <SiteImage
              src={layer.src}
              alt=""
              width={layer.width}
              height={layer.height}
              priority={layer.priority}
              sizes={layer.wrapperClassName.includes("110vw") ? "110vw" : "100vw"}
              className="block h-auto w-full select-none"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
