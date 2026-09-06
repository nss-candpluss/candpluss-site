"use client";

import { useEffect, useId, useRef, useState } from "react";

import {
  contactAttachmentCopy,
  contactFieldNotes,
  contactFieldRequirements,
  contactFormCopy,
} from "@/data/contact";
import { CONTACT_ATTACHMENT_MAX_COUNT } from "@/lib/contact/attachment-config";
import { validateContactAttachments } from "@/lib/contact/attachment-validation";
import { formatFileSize } from "@/lib/contact/format-file-size";
import { bodyText, uiText } from "@/lib/typography";
import { ContactField } from "@/sections/contact/ContactField";

export type ContactAttachmentPreview = {
  id: string;
  file: File;
  previewUrl: string | null;
  previewAvailable: boolean;
};

type ContactImageAttachmentsProps = {
  attachments: ContactAttachmentPreview[];
  onChange: (attachments: ContactAttachmentPreview[]) => void;
  error?: string | null;
  onError?: (message: string | null) => void;
};

const descriptionClassName = `font-body-ja whitespace-pre-line text-[var(--color-muted)] ${bodyText(14)}`;

const fileInputClassName =
  `inline-flex cursor-pointer items-center justify-center border border-[var(--foreground)] bg-white px-[calc(20px*var(--gap-scale-x))] py-[calc(12px*var(--gap-scale-y))] font-body-ja ${uiText(14)} text-[var(--foreground)] transition-opacity duration-300 hover:opacity-60`;

const dropZoneClassName =
  "hidden min-[640px]:flex min-[640px]:flex-col min-[640px]:items-center min-[640px]:justify-center min-[640px]:gap-[calc(12px*var(--gap-scale-y))] min-[640px]:border min-[640px]:border-dashed min-[640px]:px-[calc(24px*var(--gap-scale-x))] min-[640px]:py-[calc(32px*var(--gap-scale-y))] min-[640px]:transition-colors min-[640px]:duration-300";

const dropZoneActiveClassName = "min-[640px]:border-[var(--foreground)] min-[640px]:bg-[#f5f5f5]";

const dropZoneIdleClassName = "min-[640px]:border-divider min-[640px]:bg-white";

const dropHintClassName = `font-body-ja text-[var(--color-muted)] ${bodyText(14)}`;

const previewItemClassName =
  "flex items-start gap-[calc(12px*var(--gap-scale-x))] border border-divider bg-white p-[calc(12px*var(--gap-scale-y))]";

const thumbnailClassName =
  "size-[calc(72px*var(--gap-scale-x))] shrink-0 overflow-hidden bg-[#f5f5f5] object-cover";

const thumbnailFallbackClassName =
  "flex size-[calc(72px*var(--gap-scale-x))] shrink-0 items-center justify-center bg-[#f5f5f5] px-[calc(8px*var(--gap-scale-x))] text-center font-body-ja text-[11px] leading-[calc(16px*var(--text-scale))] text-[var(--color-muted)]";

const fileNameClassName = `font-body-ja break-all text-[var(--foreground)] ${bodyText(14)}`;

const fileSizeClassName = `font-body-ja text-[var(--color-muted)] ${bodyText(14)}`;

const removeButtonClassName =
  "ml-auto inline-flex size-[calc(32px*var(--gap-scale-x))] shrink-0 cursor-pointer items-center justify-center font-body-ja text-[clamp(18px,calc(20px*var(--text-scale)),20px)] leading-none text-[var(--foreground)] transition-opacity duration-300 hover:opacity-60";

function createPreview(file: File): ContactAttachmentPreview {
  const previewUrl = URL.createObjectURL(file);
  const previewAvailable =
    file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp";

  return {
    id: crypto.randomUUID(),
    file,
    previewUrl,
    previewAvailable,
  };
}

export function createAttachmentPreviews(files: File[]): ContactAttachmentPreview[] {
  return files.map(createPreview);
}

export function ContactImageAttachments({
  attachments,
  onChange,
  error,
  onError,
}: ContactImageAttachmentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const dragDepthRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const { fieldLabels } = contactFormCopy;
  const copy = contactAttachmentCopy;

  useEffect(() => {
    return () => {
      attachments.forEach((attachment) => {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      });
    };
  }, [attachments]);

  function addFiles(selectedFiles: File[]) {
    if (selectedFiles.length === 0) {
      return;
    }

    const nextFiles = [...attachments.map((attachment) => attachment.file), ...selectedFiles];
    const validation = validateContactAttachments(nextFiles);

    if (!validation.ok) {
      onError?.(validation.message);
      return;
    }

    onError?.(null);
    onChange(createAttachmentPreviews(nextFiles));
  }

  function handleSelectClick() {
    inputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleDragEnter(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDragging(true);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepthRef.current -= 1;

    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setIsDragging(false);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  }

  function handleRemove(id: string) {
    const nextAttachments = attachments.filter((attachment) => {
      if (attachment.id === id && attachment.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }

      return attachment.id !== id;
    });

    onChange(nextAttachments);
    onError?.(null);
  }

  const canAddMore = attachments.length < CONTACT_ATTACHMENT_MAX_COUNT;

  return (
    <ContactField
      label={copy.label}
      requirement={contactFieldRequirements.attachments}
      htmlFor={inputId}
      note={contactFieldNotes.attachments}
      error={error ?? undefined}
    >
      <p className={descriptionClassName}>{copy.description}</p>

      {attachments.length > 0 ? (
        <ul className="mt-[calc(16px*var(--gap-scale-y))] flex flex-col gap-[calc(12px*var(--gap-scale-y))]">
          {attachments.map((attachment) => (
            <li key={attachment.id} className={previewItemClassName}>
              {attachment.previewAvailable && attachment.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- blob preview URL
                <img
                  src={attachment.previewUrl}
                  alt=""
                  className={thumbnailClassName}
                />
              ) : (
                <div className={thumbnailFallbackClassName}>{copy.previewFallback}</div>
              )}

              <div className="min-w-0 flex-1">
                <p className={fileNameClassName}>{attachment.file.name}</p>
                <p className={`mt-[calc(4px*var(--gap-scale-y))] ${fileSizeClassName}`}>
                  {formatFileSize(attachment.file.size)}
                </p>
              </div>

              <button
                type="button"
                className={removeButtonClassName}
                aria-label={`${copy.removeLabel}: ${attachment.file.name}`}
                onClick={() => handleRemove(attachment.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {canAddMore ? (
        <div className="mt-[calc(16px*var(--gap-scale-y))]">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/heic,image/heif,image/webp,.jpg,.jpeg,.png,.heic,.heif,.webp"
            multiple
            className="sr-only"
            onChange={handleFileChange}
          />

          <div
            className={`${dropZoneClassName} ${isDragging ? dropZoneActiveClassName : dropZoneIdleClassName}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <p className={dropHintClassName}>{copy.dropHint}</p>
            <p className={dropHintClassName}>{copy.dropHintOr}</p>
            <button type="button" className={fileInputClassName} onClick={handleSelectClick}>
              {copy.selectButton}
            </button>
          </div>

          <div className="min-[640px]:hidden">
            <button type="button" className={fileInputClassName} onClick={handleSelectClick}>
              {copy.selectButton}
            </button>
          </div>
        </div>
      ) : null}

      <span className="sr-only">{fieldLabels.attachments}</span>
    </ContactField>
  );
}
