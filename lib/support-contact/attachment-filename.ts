const MAX_ATTACHMENT_FILENAME_LENGTH = 120;
const UNSAFE_FILENAME_CHARACTERS = /[\u0000-\u001f\u007f<>:"/\\|?*]/g;

function truncatePreservingExtension(filename: string): string {
  if (filename.length <= MAX_ATTACHMENT_FILENAME_LENGTH) {
    return filename;
  }

  const lastDotIndex = filename.lastIndexOf(".");
  const extension =
    lastDotIndex > 0 ? filename.slice(lastDotIndex).slice(0, 16) : "";
  const basenameLength = MAX_ATTACHMENT_FILENAME_LENGTH - extension.length;

  return `${filename.slice(0, basenameLength)}${extension}`;
}

export function sanitizeSupportAttachmentFilename(
  filename: string,
  fallbackIndex: number
): string {
  const normalized = filename.normalize("NFKC");
  const basename = normalized.split(/[\\/]/).pop() ?? "";
  const sanitized = basename
    .replace(UNSAFE_FILENAME_CHARACTERS, "_")
    .replace(/\s+/g, " ")
    .replace(/^\.+/, "")
    .replace(/[. ]+$/, "")
    .trim();

  return truncatePreservingExtension(
    sanitized || `support-image-${fallbackIndex + 1}.jpg`
  );
}
