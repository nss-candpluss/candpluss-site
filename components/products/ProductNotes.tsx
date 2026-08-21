import { bodyText } from "@/lib/typography";

type ProductNotesProps = {
  notes: string[];
  className?: string;
  listClassName?: string;
};

export function ProductNotes({ notes, className, listClassName }: ProductNotesProps) {
  if (!notes.length) {
    return null;
  }

  const noteClassName = className ?? bodyText(14);

  return (
    <ul
      className={`${listClassName ?? "mt-[calc(24px*var(--gap-scale-y))]"} flex flex-col gap-[calc(12px*var(--gap-scale-y))]`}
    >
      {notes.map((note) => (
        <li
          key={note}
          className={`font-body-ja text-[var(--color-muted)] ${noteClassName}`}
        >
          {note}
        </li>
      ))}
    </ul>
  );
}
