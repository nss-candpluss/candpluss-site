import { uiText } from "@/lib/typography";

const fieldNoteClassName = `mt-1 font-body-ja text-[var(--color-muted)] ${uiText(12)}`;

/** 項目の下に置く、その項目が何かの短い説明 */
export function FieldNote({ children }: { children: string }) {
  return <p className={fieldNoteClassName}>{children}</p>;
}
