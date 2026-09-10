import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendMail: vi.fn(),
  verifyTurnstile: vi.fn(),
  checkRateLimit: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: mocks.sendMail,
    };
  },
}));

vi.mock("@/lib/contact/turnstile-verify", () => ({
  verifyTurnstileToken: mocks.verifyTurnstile,
}));

vi.mock("@/lib/contact/rate-limit", () => ({
  checkContactRateLimit: mocks.checkRateLimit,
  CONTACT_RATE_LIMIT_MESSAGE:
    "送信回数が上限に達しました。10分ほど時間をおいて再度お試しください。",
}));

import { POST as postContact } from "@/app/api/contact/route";
import { POST as postSupportContact } from "@/app/api/support-contact/route";

function appendFields(
  formData: FormData,
  fields: Record<string, string>
): FormData {
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }

  return formData;
}

function createContactFormData(): FormData {
  return appendFields(new FormData(), {
    category: "product",
    lastName: "山田",
    firstName: "太郎",
    email: "customer@example.com",
    emailConfirm: "customer@example.com",
    phone: "090-1234-5678",
    postalCode: "",
    prefecture: "",
    addressLine1: "",
    addressLine2: "",
    message: "製品について質問があります。",
    privacyAccepted: "true",
    turnstileToken: "turnstile-token",
  });
}

function createSupportFormData(): FormData {
  const formData = appendFields(new FormData(), {
    category: "repair",
    serialNumber: "ABC123",
    lastName: "山田",
    firstName: "太郎",
    email: "customer@example.com",
    emailConfirm: "customer@example.com",
    phone: "090-1234-5678",
    postalCode: "123-4567",
    prefecture: "東京都",
    addressLine1: "千代田区1-1",
    addressLine2: "",
    message: "破損箇所の修理を希望します。",
    privacyAccepted: "true",
    turnstileToken: "turnstile-token",
  });
  const jpeg = new File(
    [new Uint8Array([0xff, 0xd8, 0xff, 0xe0])],
    "../破損箇所.jpg",
    { type: "image/jpeg" }
  );
  formData.append("attachments", jpeg);

  return formData;
}

function createRequest(path: string, body: FormData): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "x-forwarded-for": "203.0.113.10",
    },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("CONTACT_ADMIN_EMAIL", "admin@candpluss.camp");
  vi.stubEnv("CONTACT_FROM_EMAIL", "C AND+S <info@candpluss.camp>");
  vi.stubEnv("CONTACT_REPLY_TO_EMAIL", "info@candpluss.camp");
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  mocks.verifyTurnstile.mockResolvedValue(true);
  mocks.checkRateLimit.mockResolvedValue({
    allowed: true,
    retryAfterSeconds: null,
  });
  mocks.sendMail.mockResolvedValue({
    data: { id: "email-id" },
    error: null,
    headers: {},
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("Contact and Support API mail integration", () => {
  it("sends the Contact admin email and auto reply", async () => {
    const response = await postContact(
      createRequest("/api/contact", createContactFormData())
    );
    const body = (await response.json()) as {
      ok: boolean;
      ticketNumber: string;
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.ticketNumber).toMatch(/^CTS-/);
    expect(mocks.sendMail).toHaveBeenCalledTimes(2);
    expect(mocks.sendMail.mock.calls[0]?.[0]).toMatchObject({
      to: "admin@candpluss.camp",
      replyTo: "customer@example.com",
    });
    expect(mocks.sendMail.mock.calls[1]?.[0]).toMatchObject({
      to: "customer@example.com",
      replyTo: "info@candpluss.camp",
    });
    expect(mocks.sendMail.mock.calls[0]?.[1]).toMatchObject({
      idempotencyKey: `${body.ticketNumber}:admin`,
    });
  });

  it("sends a validated and sanitized Support attachment", async () => {
    const response = await postSupportContact(
      createRequest("/api/support-contact", createSupportFormData())
    );
    const body = (await response.json()) as {
      ok: boolean;
      ticketNumber: string;
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.ticketNumber).toMatch(/^SPR-/);
    expect(mocks.sendMail).toHaveBeenCalledTimes(2);
    expect(mocks.sendMail.mock.calls[0]?.[0]).toMatchObject({
      to: "admin@candpluss.camp",
      attachments: [
        expect.objectContaining({
          filename: "破損箇所.jpg",
          content: expect.any(Buffer),
        }),
      ],
    });
  });

  it("returns an error without sending an auto reply when admin mail fails", async () => {
    mocks.sendMail.mockResolvedValueOnce({
      data: null,
      error: { message: "Resend unavailable" },
      headers: {},
    });

    const response = await postContact(
      createRequest("/api/contact", createContactFormData())
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ ok: false });
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
  });

  it("keeps the API successful and alerts admin when auto reply fails", async () => {
    mocks.sendMail
      .mockResolvedValueOnce({
        data: { id: "admin-email" },
        error: null,
        headers: {},
      })
      .mockResolvedValueOnce({
        data: null,
        error: { message: "Recipient rejected" },
        headers: {},
      })
      .mockResolvedValueOnce({
        data: { id: "alert-email" },
        error: null,
        headers: {},
      });

    const response = await postContact(
      createRequest("/api/contact", createContactFormData())
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(mocks.sendMail).toHaveBeenCalledTimes(3);
    expect(mocks.sendMail.mock.calls[2]?.[0]).toMatchObject({
      to: "admin@candpluss.camp",
    });
    expect(mocks.sendMail.mock.calls[2]?.[1]).toMatchObject({
      idempotencyKey: expect.stringContaining(":failure-alert"),
    });
  });

  it("rejects disallowed origins before validation or external services", async () => {
    for (const [path, post] of [
      ["/api/contact", postContact],
      ["/api/support-contact", postSupportContact],
    ] as const) {
      const request = new Request(`http://localhost${path}`, {
        method: "POST",
        headers: {
          origin: "https://malicious.example",
        },
        body: new FormData(),
      });
      const response = await post(request);

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        ok: false,
        message: "許可されていない送信元からのリクエストです。",
      });
    }

    expect(mocks.verifyTurnstile).not.toHaveBeenCalled();
    expect(mocks.checkRateLimit).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it("allows same-origin requests for dynamic Preview domains", async () => {
    const previewOrigin =
      "https://candpluss-site-preview-nss-candpluss-projects.vercel.app";
    const request = new Request(`${previewOrigin}/api/contact`, {
      method: "POST",
      headers: {
        origin: previewOrigin,
      },
      body: new FormData(),
    });

    const response = await postContact(request);

    expect(response.status).toBe(400);
    expect(mocks.verifyTurnstile).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });
});
