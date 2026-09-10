import { normalizeFullWidthAscii } from "@/lib/contact/input-normalization";

const SERIAL_NUMBER_PATTERN = /^[A-Za-z0-9]+$/;
const SERIAL_NUMBER_DISALLOWED_PATTERN = /[^A-Za-z0-9]/g;

export function normalizeSupportSerialNumber(value: string): string {
  return normalizeFullWidthAscii(value);
}

export function normalizeSupportSerialNumbers(value: string): string {
  return value
    .split(/\r?\n/)
    .map((serialNumber) => normalizeSupportSerialNumber(serialNumber).trim())
    .filter(Boolean)
    .join("\n");
}

export function sanitizeSupportSerialNumberInput(value: string): string {
  return normalizeSupportSerialNumber(value).replace(
    SERIAL_NUMBER_DISALLOWED_PATTERN,
    ""
  );
}

export function isValidSupportSerialNumber(value: string): boolean {
  return SERIAL_NUMBER_PATTERN.test(value);
}
