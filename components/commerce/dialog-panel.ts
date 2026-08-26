import type { MouseEvent } from "react";

export const COMMERCE_DIALOG_OVERLAY_CLASS =
  "added-to-cart-overlay absolute inset-0 z-0 bg-black/50";

export const COMMERCE_DIALOG_PANEL_CLASS =
  "added-to-cart-panel absolute z-10 flex flex-col overflow-hidden top-[max(16px,env(safe-area-inset-top))] right-[max(16px,env(safe-area-inset-right))] bottom-[max(16px,env(safe-area-inset-bottom))] left-[max(16px,env(safe-area-inset-left))] w-auto rounded-[16px] bg-white [--cart-inline-pad:clamp(20px,calc(32px*var(--layout-scale-x)),32px)] px-[var(--cart-inline-pad)] pt-[16px] pb-[32px] text-[var(--foreground)] shadow-[0_8px_32px_rgba(25,25,25,0.14)] min-[1025px]:left-auto min-[1025px]:w-[42%] min-[1025px]:max-w-[42%]";

export function shouldOpenCartPopup(
  event: MouseEvent<HTMLAnchorElement>
): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}
