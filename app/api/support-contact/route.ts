import { NextResponse } from "next/server";
import { Resend } from "resend";

import { supportContactAttachmentValidationMessages } from "@/data/support-contact";
import { validateAttachmentContents } from "@/lib/contact/attachment-validation";
import { parseSupportContactMultipartForm } from "@/lib/support-contact/schema";
import {
  CONTACT_CORS_REJECTION_MESSAGE,
  isContactOriginAllowed,
  withContactCorsHeaders,
} from "@/lib/contact/cors";
import {
  checkContactRateLimit,
  CONTACT_RATE_LIMIT_MESSAGE,
} from "@/lib/contact/rate-limit";
import { sendResendEmailWithTimeout } from "@/lib/contact/resend-mail";
import { logContactSubmissionEvent } from "@/lib/contact/submission-monitoring";
import { verifyTurnstileToken } from "@/lib/contact/turnstile-verify";
import {
  buildAdminSupportContactMail,
  buildAutoReplySupportContactMail,
} from "@/lib/support-contact/mail";
import { sanitizeSupportAttachmentFilename } from "@/lib/support-contact/attachment-filename";
import { deliverAutoReplyAfterAcceptance } from "@/lib/contact/auto-reply-delivery";
import { generateSupportContactTicketNumber } from "@/lib/support-contact/ticket";

type ContactEnvConfig = {
  apiKey: string;
  adminEmail: string;
  fromEmail: string;
  replyToEmail: string;
};

type ResendAttachment = {
  filename: string;
  content: Buffer;
};

function getContactEnvConfig(): ContactEnvConfig | null {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.CONTACT_ADMIN_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const replyToEmail = process.env.CONTACT_REPLY_TO_EMAIL;

  if (!apiKey || !adminEmail || !fromEmail || !replyToEmail) {
    return null;
  }

  return { apiKey, adminEmail, fromEmail, replyToEmail };
}

function getClientIpAddress(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    return firstIp || null;
  }

  return request.headers.get("x-real-ip")?.trim() || null;
}

async function buildResendAttachments(files: File[]): Promise<ResendAttachment[]> {
  return Promise.all(
    files.map(async (file, index) => ({
      filename: sanitizeSupportAttachmentFilename(file.name, index),
      content: Buffer.from(await file.arrayBuffer()),
    }))
  );
}

export async function OPTIONS(request: Request) {
  if (!isContactOriginAllowed(request)) {
    return NextResponse.json(
      { ok: false, message: CONTACT_CORS_REJECTION_MESSAGE },
      { status: 403 }
    );
  }

  return new NextResponse(null, withContactCorsHeaders(request, { status: 204 }));
}

export async function POST(request: Request) {
  if (!isContactOriginAllowed(request)) {
    return NextResponse.json(
      { ok: false, message: CONTACT_CORS_REJECTION_MESSAGE },
      { status: 403 }
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "リクエスト形式が正しくありません。",
      },
      withContactCorsHeaders(request, { status: 400 })
    );
  }

  const parsed = parseSupportContactMultipartForm(formData);

  if (!parsed.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: parsed.message,
        ...(parsed.errors ? { errors: parsed.errors } : {}),
      },
      withContactCorsHeaders(request, { status: 400 })
    );
  }

  const attachmentContentValidation = await validateAttachmentContents(
    parsed.attachments,
    supportContactAttachmentValidationMessages.invalidContent
  );

  if (!attachmentContentValidation.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: attachmentContentValidation.message,
      },
      withContactCorsHeaders(request, { status: 400 })
    );
  }

  const ipAddress = getClientIpAddress(request);
  const turnstileVerified = await verifyTurnstileToken(parsed.turnstileToken, ipAddress);

  if (!turnstileVerified) {
    return NextResponse.json(
      {
        message: "Turnstile verification failed.",
      },
      withContactCorsHeaders(request, { status: 400 })
    );
  }

  const rateLimitResult = await checkContactRateLimit({
    ipAddress,
    email: parsed.data.email,
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        ok: false,
        message: CONTACT_RATE_LIMIT_MESSAGE,
      },
      withContactCorsHeaders(request, {
        status: 429,
        headers: {
          "Retry-After": String(rateLimitResult.retryAfterSeconds),
        },
      })
    );
  }

  const envConfig = getContactEnvConfig();

  if (!envConfig) {
    logContactSubmissionEvent("error", {
      event: "mail_configuration_missing",
      formKind: "support",
    });
    return NextResponse.json(
      {
        ok: false,
        message: "送信処理を開始できませんでした。時間をおいて再度お試しください。",
      },
      withContactCorsHeaders(request, { status: 500 })
    );
  }

  const receivedAt = new Date();
  const ticketNumber = generateSupportContactTicketNumber(receivedAt);
  const attachmentCount = parsed.attachments.length;
  const mailContext = {
    ticketNumber,
    receivedAt,
    ipAddress,
    data: parsed.data,
    attachmentCount,
  };

  const adminMail = buildAdminSupportContactMail(mailContext);
  const autoReplyMail = buildAutoReplySupportContactMail(mailContext);
  const resend = new Resend(envConfig.apiKey);
  const adminAttachments =
    attachmentCount > 0 ? await buildResendAttachments(parsed.attachments) : undefined;

  try {
    const adminResult = await sendResendEmailWithTimeout(
      resend,
      {
        from: envConfig.fromEmail,
        to: envConfig.adminEmail,
        replyTo: parsed.data.email,
        subject: adminMail.subject,
        text: adminMail.text,
        ...(adminAttachments ? { attachments: adminAttachments } : {}),
      },
      `${ticketNumber}:admin`
    );

    if (adminResult.error) {
      logContactSubmissionEvent("error", {
        event: "admin_mail_failed",
        formKind: "support",
        ticketNumber,
        recipientEmail: envConfig.adminEmail,
        attachmentCount,
        error: adminResult.error,
      });
      return NextResponse.json(
        {
          ok: false,
          message: "送信に失敗しました。時間をおいて再度お試しください。",
        },
        withContactCorsHeaders(request, { status: 500 })
      );
    }

  } catch (error) {
    logContactSubmissionEvent("error", {
      event: "admin_mail_failed",
      formKind: "support",
      ticketNumber,
      recipientEmail: envConfig.adminEmail,
      attachmentCount,
      error,
    });
    return NextResponse.json(
      {
        ok: false,
        message: "送信に失敗しました。時間をおいて再度お試しください。",
      },
      withContactCorsHeaders(request, { status: 500 })
    );
  }

  const autoReplyResult = await deliverAutoReplyAfterAcceptance({
    formKind: "support",
    ticketNumber,
    recipientEmail: parsed.data.email,
    adminEmail: envConfig.adminEmail,
    fromEmail: envConfig.fromEmail,
    replyToEmail: envConfig.replyToEmail,
    autoReplyMail,
    sendMail: (email, deliveryType) =>
      sendResendEmailWithTimeout(
        resend,
        email,
        `${ticketNumber}:${deliveryType}`
      ),
  });

  logContactSubmissionEvent("info", {
    event: "submission_accepted",
    formKind: "support",
    ticketNumber,
    recipientEmail: parsed.data.email,
    attachmentCount,
    ...autoReplyResult,
  });

  return NextResponse.json(
    {
      ok: true,
      ticketNumber,
    },
    withContactCorsHeaders(request)
  );
}
