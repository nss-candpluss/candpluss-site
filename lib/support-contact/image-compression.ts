import {
  SUPPORT_CONTACT_IMAGE_COMPRESSION_MAX_DIMENSION,
  SUPPORT_CONTACT_IMAGE_COMPRESSION_MAX_SIZE_MB,
} from "@/lib/support-contact/attachment-config";

const JPEG_MIME_TYPE = "image/jpeg";
const HEIC_EXTENSION_PATTERN = /\.(?:heic|heif)$/i;

function replaceWithJpegExtension(filename: string): string {
  const basename = filename.replace(/\.[^.]+$/, "");
  return `${basename || "image"}.jpg`;
}

function isHeicCandidate(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    HEIC_EXTENSION_PATTERN.test(file.name)
  );
}

async function convertHeicToJpeg(file: File): Promise<File> {
  if (!isHeicCandidate(file)) {
    return file;
  }

  const { heicTo, isHeic } = await import("heic-to/next");

  if (!(await isHeic(file))) {
    return file;
  }

  const jpeg = await heicTo({
    blob: file,
    type: JPEG_MIME_TYPE,
    quality: 0.9,
  });

  return new File([jpeg], replaceWithJpegExtension(file.name), {
    type: JPEG_MIME_TYPE,
    lastModified: file.lastModified,
  });
}

export async function compressSupportContactImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<File> {
  const inputFile = await convertHeicToJpeg(file);
  const { default: imageCompression } = await import(
    "browser-image-compression"
  );
  const compressed = await imageCompression(inputFile, {
    maxSizeMB: SUPPORT_CONTACT_IMAGE_COMPRESSION_MAX_SIZE_MB,
    maxWidthOrHeight: SUPPORT_CONTACT_IMAGE_COMPRESSION_MAX_DIMENSION,
    initialQuality: 0.82,
    fileType: JPEG_MIME_TYPE,
    preserveExif: false,
    useWebWorker: false,
    onProgress,
  });

  return new File([compressed], replaceWithJpegExtension(file.name), {
    type: JPEG_MIME_TYPE,
    lastModified: file.lastModified,
  });
}
