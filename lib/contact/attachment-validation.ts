import { contactAttachmentValidationMessages } from "@/data/contact";
import {
  CONTACT_ATTACHMENT_ALLOWED_EXTENSIONS,
  CONTACT_ATTACHMENT_ALLOWED_MIME_TYPES,
  CONTACT_ATTACHMENT_FALLBACK_MIME_TYPES,
  CONTACT_ATTACHMENT_MAX_COUNT,
  CONTACT_ATTACHMENT_MAX_FILE_SIZE,
  CONTACT_ATTACHMENT_MAX_TOTAL_SIZE,
  type ContactAttachmentAllowedExtension,
  type ContactAttachmentAllowedMimeType,
} from "@/lib/contact/attachment-config";

type ValidatableFile = {
  name: string;
  size: number;
  type: string;
};

type AttachmentValidationOptions = {
  maxCount?: number;
  maxCountMessage?: string;
  maxFileSize?: number;
  maxFileSizeMessage?: string;
  maxTotalSize?: number;
  maxTotalSizeMessage?: string;
};

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff] as const;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;
const HEIC_BRANDS = new Set([
  "heic",
  "heix",
  "hevc",
  "hevx",
  "heim",
  "heis",
  "mif1",
  "msf1",
]);

function getFileExtension(filename: string): string {
  const normalized = filename.trim().toLowerCase();
  const lastDotIndex = normalized.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return "";
  }

  return normalized.slice(lastDotIndex + 1);
}

function isAllowedExtension(extension: string): extension is ContactAttachmentAllowedExtension {
  return CONTACT_ATTACHMENT_ALLOWED_EXTENSIONS.includes(extension as ContactAttachmentAllowedExtension);
}

function isAllowedMimeType(mimeType: string): mimeType is ContactAttachmentAllowedMimeType {
  return CONTACT_ATTACHMENT_ALLOWED_MIME_TYPES.includes(mimeType as ContactAttachmentAllowedMimeType);
}

function isAllowedFallbackMimeType(mimeType: string, extension: string): boolean {
  if (!CONTACT_ATTACHMENT_FALLBACK_MIME_TYPES.includes(mimeType as (typeof CONTACT_ATTACHMENT_FALLBACK_MIME_TYPES)[number])) {
    return false;
  }

  return isAllowedExtension(extension);
}

function isAllowedFileType(file: ValidatableFile): boolean {
  const extension = getFileExtension(file.name);

  if (!isAllowedExtension(extension)) {
    return false;
  }

  const mimeType = file.type.trim().toLowerCase();

  if (!mimeType) {
    return extension === "heic" || extension === "heif";
  }

  if (isAllowedMimeType(mimeType)) {
    return true;
  }

  return isAllowedFallbackMimeType(mimeType, extension);
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

function readAscii(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(...bytes.slice(offset, offset + 4));
}

function hasHeicSignature(bytes: Uint8Array): boolean {
  if (bytes.length < 12 || readAscii(bytes, 4) !== "ftyp") {
    return false;
  }

  if (HEIC_BRANDS.has(readAscii(bytes, 8))) {
    return true;
  }

  for (let offset = 16; offset + 4 <= bytes.length; offset += 4) {
    if (HEIC_BRANDS.has(readAscii(bytes, offset))) {
      return true;
    }
  }

  return false;
}

function matchesImageSignature(bytes: Uint8Array): boolean {
  return (
    startsWith(bytes, JPEG_SIGNATURE) ||
    startsWith(bytes, PNG_SIGNATURE) ||
    hasHeicSignature(bytes)
  );
}

export function validateContactAttachments(
  files: ValidatableFile[],
  options: AttachmentValidationOptions = {}
): { ok: true } | { ok: false; message: string } {
  const maxCount = options.maxCount ?? CONTACT_ATTACHMENT_MAX_COUNT;
  const maxFileSize =
    options.maxFileSize ?? CONTACT_ATTACHMENT_MAX_FILE_SIZE;
  const maxTotalSize =
    options.maxTotalSize ?? CONTACT_ATTACHMENT_MAX_TOTAL_SIZE;

  if (files.length > maxCount) {
    return {
      ok: false,
      message:
        options.maxCountMessage ??
        contactAttachmentValidationMessages.maxCount,
    };
  }

  let totalSize = 0;

  for (const file of files) {
    if (file.size <= 0) {
      continue;
    }

    if (!isAllowedFileType(file)) {
      return { ok: false, message: contactAttachmentValidationMessages.invalidType };
    }

    if (file.size > maxFileSize) {
      return {
        ok: false,
        message:
          options.maxFileSizeMessage ??
          contactAttachmentValidationMessages.maxFileSize,
      };
    }

    totalSize += file.size;
  }

  if (totalSize > maxTotalSize) {
    return {
      ok: false,
      message:
        options.maxTotalSizeMessage ??
        contactAttachmentValidationMessages.maxTotalSize,
    };
  }

  return { ok: true };
}

export async function validateAttachmentContents(
  files: File[],
  invalidContentMessage: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  for (const file of files) {
    const bytes = new Uint8Array(await file.slice(0, 64).arrayBuffer());

    if (!matchesImageSignature(bytes)) {
      return { ok: false, message: invalidContentMessage };
    }
  }

  return { ok: true };
}

export function collectAttachmentFiles(formData: FormData): File[] {
  return formData
    .getAll("attachments")
    .filter((item): item is File => item instanceof File && item.size > 0);
}
