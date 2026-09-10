const FULL_WIDTH_ASCII_OFFSET = 0xfee0;
const FULL_WIDTH_ASCII_PATTERN = /[！-～]/g;
const FULL_WIDTH_SPACE_PATTERN = /\u3000/g;

export function normalizeFullWidthAscii(value: string): string {
  return value
    .replace(FULL_WIDTH_ASCII_PATTERN, (character) =>
      String.fromCharCode(character.charCodeAt(0) - FULL_WIDTH_ASCII_OFFSET)
    )
    .replace(FULL_WIDTH_SPACE_PATTERN, " ");
}

export function normalizeContactNumberInput(value: string): string {
  return normalizeFullWidthAscii(value);
}
