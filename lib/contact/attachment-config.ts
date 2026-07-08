export const CONTACT_ATTACHMENT_MAX_COUNT = 3;
export const CONTACT_ATTACHMENT_MAX_FILE_SIZE = 10 * 1024 * 1024;
export const CONTACT_ATTACHMENT_MAX_TOTAL_SIZE = 30 * 1024 * 1024;
export const CONTACT_ATTACHMENT_FORM_FIELD = "attachments";

export const CONTACT_ATTACHMENT_ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "heic",
  "heif",
  "webp",
] as const;

export const CONTACT_ATTACHMENT_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
] as const;

export type ContactAttachmentAllowedExtension =
  (typeof CONTACT_ATTACHMENT_ALLOWED_EXTENSIONS)[number];

export type ContactAttachmentAllowedMimeType =
  (typeof CONTACT_ATTACHMENT_ALLOWED_MIME_TYPES)[number];

export const CONTACT_ATTACHMENT_FALLBACK_MIME_TYPES = [
  "application/octet-stream",
] as const;
