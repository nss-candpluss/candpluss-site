import { assetPath } from "@/lib/assetPath";

export function maskGraphicStyle(src: string) {
  const resolved = assetPath(src);

  return {
    maskImage: `url('${resolved}')`,
    WebkitMaskImage: `url('${resolved}')`,
    maskPosition: "center",
    WebkitMaskPosition: "center",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskSize: "contain",
    WebkitMaskSize: "contain",
  } as const;
}

export const arrowMaskStyle = maskGraphicStyle("/assets/icons/icon-arrow-right.svg");
