/** Concept 英字見出しの折り返し単位。同一行の語間だけ gap-x、折り返し行間は gap-y。 */
export const conceptTitleWrapClassName =
  "flex w-full flex-wrap justify-center gap-x-[0.3em] gap-y-[0.15em]";

export function splitConceptTitleWrapUnits(title: string): string[] {
  const plusSeparated = title.split(" + ");

  if (plusSeparated.length === 1) {
    return title.split(" ").filter(Boolean);
  }

  const [beforePlus, ...afterPlus] = plusSeparated;

  return [
    ...(beforePlus?.split(" ").filter(Boolean) ?? []),
    ...afterPlus.map((part) => `+ ${part}`),
  ];
}
