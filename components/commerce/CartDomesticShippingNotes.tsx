import { cartDomesticShippingNotes } from "@/data/cart";

/** Support ページの注釈（※行）と同じ字サイズ・行送り */
export const cartAnnotationNoteClassName =
  "font-body-ja text-[clamp(12px,calc(13px*var(--text-scale)),13px)] leading-[1.3] text-[var(--foreground)]";

export function CartDomesticShippingNotes() {
  return (
    <div className="mt-[clamp(12px,calc(16px*var(--gap-scale-y)),16px)] flex flex-col gap-[clamp(8px,calc(12px*var(--gap-scale-y)),12px)]">
      {cartDomesticShippingNotes.map((note) => (
        <p key={note} className={cartAnnotationNoteClassName}>
          {note}
        </p>
      ))}
    </div>
  );
}
