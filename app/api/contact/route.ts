import { NextResponse } from "next/server";
import { Resend } from "resend";

import {
  buildAdminContactMail,
  buildAutoReplyContactMail,
} from "@/lib/contact/contact-mail";
import { parseContactMultipartForm } from "@/lib/contact/contact-schema";
import { withContactCorsHeaders } from "@/lib/contact/cors";
import { generateContactTicketNumber } from "@/lib/contact/contact-ticket";
import { verifyTurnstileToken } from "@/lib/contact/turnstile-verify";

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
    files.map(async (file) => ({
      filename: file.name,
      content: Buffer.from(await file.arrayBuffer()),
    }))
  );
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, withContactCorsHeaders(request, { status: 204 }));
}

export async function POST(request: Request) {
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

  const envConfig = getContactEnvConfig();

  if (!envConfig) {
    console.error("[contact] Missing mail environment variables.");
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
  const attachmentCount = parsed.attachments.length;
  const mailContext = {
    ticketNumber,
    receivedAt,
    ipAddress,
    data: parsed.data,
    attachmentCount,
  };

  const adminMail = buildAdminContactMail(mailContext);
  const autoReplyMail = buildAutoReplyContactMail(mailContext);
  const resend = new Resend(envConfig.apiKey);
  const adminAttachments =
    attachmentCount > 0 ? await buildResendAttachments(parsed.attachments) : undefined;

  try {
    const adminResult = await resend.emails.send({
      from: envConfig.fromEmail,
      to: envConfig.adminEmail,
      replyTo: parsed.data.email,
      subject: adminMail.subject,
      text: adminMail.text,
      ...(adminAttachments ? { attachments: adminAttachments } : {}),
    });

    if (adminResult.error) {
      console.error("[contact] Admin mail failed:", adminResult.error);
      return NextResponse.json(
        {
          ok: false,
          message: "送信に失敗しました。時間をおいて再度お試しください。",
        },
        withContactCorsHeaders(request, { status: 500 })
      );
    }

    const autoReplyResult = await resend.emails.send({
      from: envConfig.fromEmail,
      to: parsed.data.email,
      replyTo: envConfig.replyToEmail,
      subject: autoReplyMail.subject,
      text: autoReplyMail.text,
    });

    if (autoReplyResult.error) {
      console.error("[contact] Auto reply mail failed:", autoReplyResult.error);
      return NextResponse.json(
        {
          ok: false,
          message: "送信に失敗しました。時間をおいて再度お試しください。",
        },
        withContactCorsHeaders(request, { status: 500 })
      );
    }
  } catch (error) {
    console.error("[contact] Mail send error:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "送信に失敗しました。時間をおいて再度お試しください。",
      },
      withContactCorsHeaders(request, { status: 500 })
    );
  }

  return NextResponse.json(
    {
      ok: true,
      ticketNumber,
    },
    withContactCorsHeaders(request)
  );
}
