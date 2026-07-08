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

export function validateContactAttachments(
  files: ValidatableFile[]
): { ok: true } | { ok: false; message: string } {
  if (files.length > CONTACT_ATTACHMENT_MAX_COUNT) {
    return { ok: false, message: contactAttachmentValidationMessages.maxCount };
  }

  let totalSize = 0;

  for (const file of files) {
    if (file.size <= 0) {
      continue;
    }

    if (!isAllowedFileType(file)) {
      return { ok: false, message: contactAttachmentValidationMessages.invalidType };
    }

    if (file.size > CONTACT_ATTACHMENT_MAX_FILE_SIZE) {
      return { ok: false, message: contactAttachmentValidationMessages.maxFileSize };
    }

    totalSize += file.size;
  }

  if (totalSize > CONTACT_ATTACHMENT_MAX_TOTAL_SIZE) {
    return { ok: false, message: contactAttachmentValidationMessages.maxTotalSize };
  }

  return { ok: true };
}

export function collectAttachmentFiles(formData: FormData): File[] {
  return formData
    .getAll("attachments")
    .filter((item): item is File => item instanceof File && item.size > 0);
}
