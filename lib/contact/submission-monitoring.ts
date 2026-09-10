import type { ContactMailFormKind } from "@/lib/contact/auto-reply-delivery";

const EMAIL_ADDRESS_PATTERN =
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

export type ContactSubmissionEvent =
  | "mail_configuration_missing"
  | "admin_mail_failed"
  | "auto_reply_failed"
  | "auto_reply_alert_failed"
  | "submission_accepted";

type ContactSubmissionLog = {
  event: ContactSubmissionEvent;
  formKind: ContactMailFormKind;
  ticketNumber?: string;
  recipientEmail?: string;
  autoReplySent?: boolean;
  alertSent?: boolean;
  attachmentCount?: number;
  error?: unknown;
};

function formatLogError(error: unknown): string {
  let formatted: string;

  if (error instanceof Error) {
    formatted = `${error.name}: ${error.message}`;
  } else if (typeof error === "string") {
    formatted = error;
  } else {
    try {
      formatted = JSON.stringify(error) || "Unknown submission error";
    } catch {
      formatted = "Unknown submission error";
    }
  }

  return formatted
    .replace(EMAIL_ADDRESS_PATTERN, "[redacted-email]")
    .slice(0, 2_000);
}

function getEmailDomain(email: string): string {
  const separatorIndex = email.lastIndexOf("@");
  return separatorIndex >= 0
    ? email.slice(separatorIndex + 1).toLowerCase()
    : "unknown";
}

export function logContactSubmissionEvent(
  level: "info" | "error",
  details: ContactSubmissionLog
): void {
  const { recipientEmail, error, ...safeDetails } = details;
  const payload = {
    ...safeDetails,
    ...(recipientEmail
      ? { recipientDomain: getEmailDomain(recipientEmail) }
      : {}),
    ...(error === undefined ? {} : { error: formatLogError(error) }),
  };

  console[level]("[contact-monitor] Submission event", payload);
}
