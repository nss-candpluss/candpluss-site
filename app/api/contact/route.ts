import { NextResponse } from "next/server";
import { Resend } from "resend";

import {
  buildAdminContactMail,
  buildAutoReplyContactMail,
} from "@/lib/contact/contact-mail";
import { deliverAutoReplyAfterAcceptance } from "@/lib/contact/auto-reply-delivery";
import { parseContactMultipartForm } from "@/lib/contact/contact-schema";
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
import { generateContactTicketNumber } from "@/lib/contact/contact-ticket";
import { verifyTurnstileToken } from "@/lib/contact/turnstile-verify";

type ContactEnvConfig = {
  apiKey: string;
  adminEmail: string;
  fromEmail: string;
  replyToEmail: string;
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

  const parsed = parseContactMultipartForm(formData);

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
      formKind: "contact",
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
  const ticketNumber = generateContactTicketNumber(receivedAt);
  const mailContext = {
    ticketNumber,
    receivedAt,
    ipAddress,
    data: parsed.data,
  };

  const adminMail = buildAdminContactMail(mailContext);
  const autoReplyMail = buildAutoReplyContactMail(mailContext);
  const resend = new Resend(envConfig.apiKey);

  try {
    const adminResult = await sendResendEmailWithTimeout(
      resend,
      {
        from: envConfig.fromEmail,
        to: envConfig.adminEmail,
        replyTo: parsed.data.email,
        subject: adminMail.subject,
        text: adminMail.text,
      },
      `${ticketNumber}:admin`
    );

    if (adminResult.error) {
      logContactSubmissionEvent("error", {
        event: "admin_mail_failed",
        formKind: "contact",
        ticketNumber,
        recipientEmail: envConfig.adminEmail,
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
      formKind: "contact",
      ticketNumber,
      recipientEmail: envConfig.adminEmail,
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
    formKind: "contact",
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
    formKind: "contact",
    ticketNumber,
    recipientEmail: parsed.data.email,
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
