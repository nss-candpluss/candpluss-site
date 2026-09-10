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
  onProcessingChange?: (isProcessing: boolean) => void;
  emphasizeDescription?: boolean;
  fixedTypography?: boolean;
  description?: string;
  dropHint?: string;
  addButtonLabel?: string;
  note?: string;
  maxCount?: number;
  maxCountMessage?: string;
  maxReachedMessage?: string;
  maxFileSize?: number;
  maxFileSizeMessage?: string;
  maxTotalSize?: number;
  maxTotalSizeMessage?: string;
  processingMessage?: string;
  processingFailedMessage?: string;
  processFile?: (
    file: File,
    onProgress?: (progress: number) => void
  ) => Promise<File>;
};

type AttachmentProcessingState = {
  current: number;
  total: number;
  progress: number;
};

const descriptionClassName = `font-body-ja whitespace-pre-line text-[var(--color-muted)] ${bodyText(14)}`;

const emphasizedDescriptionClassName =
  "font-body-ja text-[clamp(16px,calc(18px*var(--text-scale)),18px)] leading-[clamp(28px,calc(31.5px*var(--text-scale)),31.5px)] font-normal whitespace-pre-line text-[var(--foreground)]";

const fixedDescriptionClassName =
  "font-body-ja whitespace-pre-line text-[15px] leading-[1.3] font-normal text-[var(--foreground)]";

const defaultFileInputClassName =
  `inline-flex cursor-pointer items-center justify-center border border-[var(--foreground)] bg-white px-[calc(20px*var(--gap-scale-x))] py-[calc(12px*var(--gap-scale-y))] font-body-ja ${uiText(14)} text-[var(--foreground)] transition-opacity duration-300 hover:opacity-60`;

const fixedFileInputClassName =
  `inline-flex min-h-[calc(24px*var(--text-scale)+64px*var(--layout-scale-y))] w-full cursor-pointer items-center justify-center rounded-full border border-[var(--foreground)] bg-[#f5f5f5] px-[calc(32px*var(--gap-scale-x))] py-[calc(32px*var(--layout-scale-y))] font-body-ja font-semibold text-[var(--foreground)] transition-opacity duration-300 hover:opacity-60 min-[640px]:max-w-[180px] min-[640px]:bg-white min-[1025px]:min-h-[calc(24px*var(--text-scale)+36px*var(--gap-scale-y))] min-[1025px]:py-[calc(18px*var(--gap-scale-y))] ${uiText(16)}`;

const dropZoneClassName =
  "hidden min-[640px]:flex min-[640px]:flex-col min-[640px]:items-center min-[640px]:justify-center min-[640px]:gap-[calc(12px*var(--gap-scale-y))] min-[640px]:px-[calc(24px*var(--gap-scale-x))] min-[640px]:py-[calc(32px*var(--gap-scale-y))] min-[640px]:transition-colors min-[640px]:duration-300";

const defaultDropZoneFrameClassName =
  "min-[640px]:border min-[640px]:border-dashed";

const dropZoneActiveClassName =
  "min-[640px]:border-[var(--foreground)] min-[640px]:bg-[#f5f5f5]";

const dropZoneIdleClassName =
  "min-[640px]:border-divider min-[640px]:bg-white";

const fixedDropZoneClassName =
  "min-[640px]:relative min-[640px]:min-h-[300px] min-[640px]:rounded-[8px] min-[640px]:bg-[#f5f5f5]";

const dropHintClassName = `font-body-ja text-[var(--color-muted)] ${bodyText(14)}`;

const previewItemClassName =
  "flex items-start gap-[calc(12px*var(--gap-scale-x))] border border-divider bg-white p-[calc(12px*var(--gap-scale-y))]";

const fixedPreviewItemClassName =
  "flex items-center bg-transparent pb-[calc(24px*var(--gap-scale-y))]";

const thumbnailClassName =
  "size-[calc(72px*var(--gap-scale-x))] shrink-0 overflow-hidden bg-[#f5f5f5] object-cover";

const fixedThumbnailClassName =
  "mr-[clamp(12px,calc(20px*var(--gap-scale-x)),20px)] size-[clamp(60px,calc(144px*var(--gap-scale-x)),144px)] shrink-0 overflow-hidden rounded-[8px] bg-[#f5f5f5] object-cover";

const thumbnailFallbackClassName =
  "flex size-[calc(72px*var(--gap-scale-x))] shrink-0 items-center justify-center bg-[#f5f5f5] px-[calc(8px*var(--gap-scale-x))] text-center font-body-ja text-[11px] leading-[calc(16px*var(--text-scale))] text-[var(--color-muted)]";

const fixedThumbnailFallbackClassName =
  "mr-[clamp(12px,calc(20px*var(--gap-scale-x)),20px)] flex size-[clamp(60px,calc(144px*var(--gap-scale-x)),144px)] shrink-0 items-center justify-center rounded-[8px] bg-[#f5f5f5] px-[calc(8px*var(--gap-scale-x))] text-center font-body-ja text-[11px] leading-[calc(16px*var(--text-scale))] text-[var(--color-muted)]";

const fileNameClassName = `font-body-ja break-all text-[var(--foreground)] ${bodyText(14)}`;

const fixedFileNameClassName = `font-body-ja truncate text-[var(--foreground)] ${bodyText(14)}`;

const fileSizeClassName = `font-body-ja text-[var(--color-muted)] ${bodyText(14)}`;

const removeButtonClassName =
  "ml-auto inline-flex size-[calc(32px*var(--gap-scale-x))] shrink-0 cursor-pointer items-center justify-center font-body-ja text-[clamp(18px,calc(20px*var(--text-scale)),20px)] leading-none text-[var(--foreground)] transition-opacity duration-300 hover:opacity-60";

const fixedRemoveButtonClassName =
  "relative ml-[clamp(20px,calc(40px*var(--gap-scale-x)),40px)] size-[calc(32px*var(--text-scale))] shrink-0 cursor-pointer rounded-full border border-[var(--foreground)] bg-transparent text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)] before:absolute before:top-1/2 before:left-1/2 before:h-px before:w-[calc(14px*var(--text-scale))] before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-45 before:bg-current before:content-[''] after:absolute after:top-1/2 after:left-1/2 after:h-px after:w-[calc(14px*var(--text-scale))] after:-translate-x-1/2 after:-translate-y-1/2 after:-rotate-45 after:bg-current after:content-['']";

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
  onProcessingChange,
  emphasizeDescription = false,
  fixedTypography = false,
  description,
  dropHint,
  addButtonLabel,
  note,
  maxCount = CONTACT_ATTACHMENT_MAX_COUNT,
  maxCountMessage,
  maxReachedMessage,
  maxFileSize,
  maxFileSizeMessage,
  maxTotalSize,
  maxTotalSizeMessage,
  processingMessage,
  processingFailedMessage,
  processFile,
}: ContactImageAttachmentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const dragDepthRef = useRef(0);
  const processingRef = useRef(false);
  const attachmentsRef = useRef(attachments);
  const onProcessingChangeRef = useRef(onProcessingChange);
  const [isDragging, setIsDragging] = useState(false);
  const [processingState, setProcessingState] =
    useState<AttachmentProcessingState | null>(null);
  const { fieldLabels } = contactFormCopy;
  const copy = contactAttachmentCopy;

  useEffect(() => {
    attachmentsRef.current = attachments;
    onProcessingChangeRef.current = onProcessingChange;
  }, [attachments, onProcessingChange]);

  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((attachment) => {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      });
      onProcessingChangeRef.current?.(false);
    };
  }, []);

  async function addFiles(selectedFiles: File[]) {
    if (selectedFiles.length === 0 || processingRef.current) {
      return;
    }

    const existingFiles = attachments.map((attachment) => attachment.file);
    const selectionValidation = validateContactAttachments(
      [...existingFiles, ...selectedFiles],
      {
        maxCount,
        maxCountMessage,
        maxFileSize: Number.POSITIVE_INFINITY,
        maxTotalSize: Number.POSITIVE_INFINITY,
      }
    );

    if (!selectionValidation.ok) {
      onError?.(selectionValidation.message);
      return;
    }

    processingRef.current = true;
    onError?.(null);
    onProcessingChange?.(true);

    try {
      const processedFiles: File[] = [];

      for (const [index, file] of selectedFiles.entries()) {
        setProcessingState({
          current: index + 1,
          total: selectedFiles.length,
          progress: 0,
        });
        processedFiles.push(
          processFile
            ? await processFile(file, (progress) => {
                setProcessingState({
                  current: index + 1,
                  total: selectedFiles.length,
                  progress,
                });
              })
            : file
        );
      }

      const nextFiles = [...existingFiles, ...processedFiles];
      const validation = validateContactAttachments(nextFiles, {
        maxCount,
        maxCountMessage,
        maxFileSize,
        maxFileSizeMessage,
        maxTotalSize,
        maxTotalSizeMessage,
      });

      if (!validation.ok) {
        onError?.(validation.message);
        return;
      }

      onChange([
        ...attachments,
        ...createAttachmentPreviews(processedFiles),
      ]);
    } catch {
      onError?.(
        processingFailedMessage ??
          "画像の処理に失敗しました。別の画像を選択してください。"
      );
    } finally {
      processingRef.current = false;
      setProcessingState(null);
      onProcessingChange?.(false);
    }
  }

  function handleSelectClick() {
    if (processingRef.current) {
      return;
    }

    inputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    void addFiles(Array.from(event.target.files ?? []));
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
    void addFiles(Array.from(event.dataTransfer.files));
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

  const isProcessing = processingState !== null;
  const hasRemainingSlots = attachments.length < maxCount;
  const canAddMore = hasRemainingSlots && !isProcessing;
  const totalSize = attachments.reduce(
    (sum, attachment) => sum + attachment.file.size,
    0
  );
  const selectButtonLabel =
    attachments.length > 0 && addButtonLabel
      ? addButtonLabel
      : copy.selectButton;

  function renderAttachmentList(className = "") {
    if (attachments.length === 0) {
      return null;
    }

    return (
      <ul
        className={`flex w-full flex-col ${
          fixedTypography
            ? "divide-y divide-[var(--color-divider)]"
            : "gap-[calc(12px*var(--gap-scale-y))]"
        } ${className}`}
      >
        {attachments.map((attachment) => (
          <li
            key={attachment.id}
            className={
              fixedTypography
                ? `${fixedPreviewItemClassName} ${
                    attachments.length === 1
                      ? "pt-[calc(24px*var(--gap-scale-y))] min-[640px]:pt-0"
                      : "pt-[calc(24px*var(--gap-scale-y))]"
                  }`
                : previewItemClassName
            }
          >
            {attachment.previewAvailable && attachment.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- blob preview URL
              <img
                src={attachment.previewUrl}
                alt=""
                className={
                  fixedTypography
                    ? fixedThumbnailClassName
                    : thumbnailClassName
                }
              />
            ) : (
              <div
                className={
                  fixedTypography
                    ? fixedThumbnailFallbackClassName
                    : thumbnailFallbackClassName
                }
              >
                {copy.previewFallback}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p
                className={
                  fixedTypography
                    ? fixedFileNameClassName
                    : fileNameClassName
                }
              >
                {attachment.file.name}
              </p>
              <p
                className={`mt-[calc(4px*var(--gap-scale-y))] ${fileSizeClassName}`}
              >
                {fixedTypography
                  ? `(${formatFileSize(attachment.file.size)})`
                  : formatFileSize(attachment.file.size)}
              </p>
            </div>

            <button
              type="button"
              className={
                `${
                  fixedTypography
                    ? fixedRemoveButtonClassName
                    : removeButtonClassName
                } disabled:cursor-not-allowed disabled:opacity-40`
              }
              aria-label={`${copy.removeLabel}: ${attachment.file.name}`}
              onClick={() => handleRemove(attachment.id)}
              disabled={isProcessing}
            >
              {fixedTypography ? null : "×"}
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ContactField
      label={copy.label}
      requirement={contactFieldRequirements.attachments}
      htmlFor={inputId}
      note={note ?? contactFieldNotes.attachments}
      error={error ?? undefined}
      fixedTitleSize={fixedTypography}
    >
      <p
        className={
          fixedTypography
            ? fixedDescriptionClassName
            : emphasizeDescription
            ? emphasizedDescriptionClassName
            : descriptionClassName
        }
      >
        {description ?? copy.description}
      </p>

      {processingState ? (
        <p
          className={`mt-[calc(12px*var(--gap-scale-y))] font-body-ja text-[var(--foreground)] ${bodyText(14)}`}
          role="status"
          aria-live="polite"
        >
          {processingMessage ?? "画像を処理しています。"}
          {`（${processingState.current}/${processingState.total}・${Math.round(
            processingState.progress
          )}%）`}
        </p>
      ) : null}

      {renderAttachmentList(
        `mt-[calc(16px*var(--gap-scale-y))] ${
          fixedTypography ? "min-[640px]:hidden" : ""
        }`
      )}

      {hasRemainingSlots || (fixedTypography && attachments.length > 0) ? (
        <div
          className={
            fixedTypography && attachments.length === 0
              ? "mt-[clamp(20px,calc(24px*var(--gap-scale-y)),24px)] min-[640px]:mt-[calc(16px*var(--gap-scale-y))]"
              : "mt-[calc(16px*var(--gap-scale-y))]"
          }
        >
          {canAddMore ? (
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif,image/webp,.jpg,.jpeg,.png,.heic,.heif,.webp"
              multiple
              className="sr-only"
              onChange={handleFileChange}
            />
          ) : null}

          <div
            className={`${dropZoneClassName} ${
              fixedTypography
                ? fixedDropZoneClassName
                : `${defaultDropZoneFrameClassName} ${
                    isDragging
                      ? dropZoneActiveClassName
                      : dropZoneIdleClassName
                  }`
            }`}
            onDragEnter={canAddMore ? handleDragEnter : undefined}
            onDragOver={canAddMore ? handleDragOver : undefined}
            onDragLeave={canAddMore ? handleDragLeave : undefined}
            onDrop={canAddMore ? handleDrop : undefined}
          >
            {fixedTypography
              ? renderAttachmentList(
                  canAddMore
                    ? "mb-[calc(24px*var(--gap-scale-y))]"
                    : ""
                )
              : null}
            {!fixedTypography ? (
              <>
                <p className={dropHintClassName}>{dropHint ?? copy.dropHint}</p>
                <p className={dropHintClassName}>{copy.dropHintOr}</p>
              </>
            ) : null}
            {canAddMore ? (
              <button
                type="button"
                className={
                  fixedTypography
                    ? fixedFileInputClassName
                    : defaultFileInputClassName
                }
                onClick={handleSelectClick}
              >
                {selectButtonLabel}
              </button>
            ) : null}
            {fixedTypography && canAddMore ? (
              <p
                className={`w-full px-[calc(24px*var(--gap-scale-x))] text-center ${
                  attachments.length === 0
                    ? "absolute top-[calc(50%+12px*var(--text-scale)+32px*var(--layout-scale-y)+12px*var(--gap-scale-y))] left-1/2 -translate-x-1/2 min-[1025px]:top-[calc(50%+12px*var(--text-scale)+30px*var(--gap-scale-y))]"
                    : ""
                } ${dropHintClassName}`}
              >
                {dropHint ?? copy.dropHint}
              </p>
            ) : null}
          </div>

          <div className="min-[640px]:hidden">
            {canAddMore ? (
              <button
                type="button"
                className={
                  fixedTypography
                    ? fixedFileInputClassName
                    : defaultFileInputClassName
                }
                onClick={handleSelectClick}
              >
                {selectButtonLabel}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {attachments.length > 0 ? (
        <div
          className={`mt-[calc(12px*var(--gap-scale-y))] font-body-ja text-[var(--color-muted)] ${bodyText(14)}`}
          aria-live="polite"
        >
          <p>{`添付枚数：${attachments.length}/${maxCount}枚`}</p>
          {maxTotalSize ? (
            <p>{`添付容量：${formatFileSize(totalSize)} / ${formatFileSize(
              maxTotalSize
            )}`}</p>
          ) : null}
          {!hasRemainingSlots && maxReachedMessage ? (
            <p className="text-[var(--foreground)]">{maxReachedMessage}</p>
          ) : null}
        </div>
      ) : null}

      <span className="sr-only">{fieldLabels.attachments}</span>
    </ContactField>
  );
}
