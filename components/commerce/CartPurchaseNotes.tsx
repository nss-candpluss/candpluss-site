import { cartPurchaseNotes } from "@/data/cart";

/** Support ページの注釈（※行）と同じ字サイズ・行送り */
export const cartAnnotationNoteClassName =
  "font-body-ja text-[clamp(12px,calc(13px*var(--text-scale)),13px)] leading-[1.3] text-[var(--foreground)]";

export function CartPurchaseNotes() {
  /*
    狭い画面では ※ が折り返して2行になり、行と行の間が詰まって見える。
    そこに ※ 同士の間を広く取ると、ひと続きの文が離れて見えるので、
    下限は狭めにする。
  */
  return (
    <div className="mt-[clamp(12px,calc(16px*var(--gap-scale-y)),16px)] flex flex-col gap-[clamp(5px,calc(9px*var(--gap-scale-y)),9px)]">
      {cartPurchaseNotes.map((note) => (
        <p key={note} className={cartAnnotationNoteClassName}>
          {note}
        </p>
      ))}
    </div>
  );
}
