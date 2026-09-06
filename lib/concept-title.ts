/** Concept 英字見出しの折り返し単位。同一行の語間だけ gap-x、折り返し行間は gap-y。 */
export const conceptTitleWrapClassName =
  "flex w-full flex-wrap justify-center gap-x-[0.3em] gap-y-[0.15em]";

const PREFERRED_CONCEPT_TITLE_WRAP_UNITS: Record<string, string[]> = {
  "Camp + Something": ["Camp +", "Something"],
};

export function splitConceptTitleWrapUnits(title: string): string[] {
  const preferredUnits = PREFERRED_CONCEPT_TITLE_WRAP_UNITS[title];

  if (preferredUnits) {
    return preferredUnits;
  }

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
