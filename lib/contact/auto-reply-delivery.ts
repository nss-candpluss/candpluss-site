import { logContactSubmissionEvent } from "@/lib/contact/submission-monitoring";

export type ContactMailFormKind = "contact" | "support";

export type ContactTextEmail = {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
};

type ContactMailSendResult = {
  error?: unknown | null;
};

type DeliverAutoReplyOptions = {
  formKind: ContactMailFormKind;
  ticketNumber: string;
  recipientEmail: string;
  adminEmail: string;
  fromEmail: string;
  replyToEmail: string;
  autoReplyMail: {
    subject: string;
    text: string;
  };
  sendMail: (
    email: ContactTextEmail,
    deliveryType: "auto-reply" | "failure-alert"
  ) => Promise<ContactMailSendResult>;
};

export type AutoReplyDeliveryResult =
  | { autoReplySent: true; alertSent: false }
  | { autoReplySent: false; alertSent: boolean };

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`.slice(0, 2000);
  }

  if (typeof error === "string") {
    return error.slice(0, 2000);
  }

  try {
    return (JSON.stringify(error) || "Unknown mail delivery error").slice(
      0,
      2000
    );
  } catch {
    return "Unknown mail delivery error";
  }
}

function getFormLabel(formKind: ContactMailFormKind): string {
  return formKind === "contact" ? "Contact" : "Support";
}

function buildFailureAlert(
  options: DeliverAutoReplyOptions,
  failure: unknown
): ContactTextEmail {
  const formLabel = getFormLabel(options.formKind);

  return {
    from: options.fromEmail,
    to: options.adminEmail,
    replyTo: options.replyToEmail,
    subject: `【C AND+S／送信障害】${formLabel}自動返信メール送信失敗（${options.ticketNumber}）`,
    text: [
      "お問い合わせの受付は完了しましたが、自動返信メールの送信に失敗しました。",
      "",
      `フォーム：${formLabel}`,
      `受付番号：${options.ticketNumber}`,
      `自動返信先：${options.recipientEmail}`,
      "",
      "失敗内容：",
      formatError(failure),
      "",
      "必要に応じて、お客様への個別連絡をご確認ください。",
    ].join("\n"),
  };
}

function logDeliveryFailure(
  event: "auto_reply_failed" | "auto_reply_alert_failed",
  options: DeliverAutoReplyOptions,
  failure: unknown
): void {
  logContactSubmissionEvent("error", {
    event,
    formKind: options.formKind,
    ticketNumber: options.ticketNumber,
    recipientEmail: options.recipientEmail,
    error: failure,
  });
}

export async function deliverAutoReplyAfterAcceptance(
  options: DeliverAutoReplyOptions
): Promise<AutoReplyDeliveryResult> {
  let autoReplyFailure: unknown = null;

  try {
    const result = await options.sendMail(
      {
        from: options.fromEmail,
        to: options.recipientEmail,
        replyTo: options.replyToEmail,
        subject: options.autoReplyMail.subject,
        text: options.autoReplyMail.text,
      },
      "auto-reply"
    );
    autoReplyFailure = result.error ?? null;
  } catch (error) {
    autoReplyFailure = error;
  }

  if (autoReplyFailure === null) {
    return { autoReplySent: true, alertSent: false };
  }

  logDeliveryFailure("auto_reply_failed", options, autoReplyFailure);

  try {
    const alertResult = await options.sendMail(
      buildFailureAlert(options, autoReplyFailure),
      "failure-alert"
    );

    if (!alertResult.error) {
      return { autoReplySent: false, alertSent: true };
    }

    logDeliveryFailure(
      "auto_reply_alert_failed",
      options,
      alertResult.error
    );
  } catch (error) {
    logDeliveryFailure("auto_reply_alert_failed", options, error);
  }

  return { autoReplySent: false, alertSent: false };
}
