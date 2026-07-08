let attachmentFiles: File[] = [];

export function getContactAttachments(): File[] {
  return attachmentFiles;
}

export function setContactAttachments(files: File[]): void {
  attachmentFiles = files;
}

export function clearContactAttachments(): void {
  attachmentFiles = [];
}
