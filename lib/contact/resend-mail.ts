import type {
  CreateEmailOptions,
  CreateEmailRequestOptions,
  CreateEmailResponse,
  Resend,
} from "resend";

export const RESEND_REQUEST_TIMEOUT_MS = 10_000;

type ResendRequestOptionsWithSignal = CreateEmailRequestOptions & {
  signal: AbortSignal;
};

export async function sendResendEmailWithTimeout(
  resend: Resend,
  email: CreateEmailOptions,
  idempotencyKey: string,
  timeoutMs = RESEND_REQUEST_TIMEOUT_MS
): Promise<CreateEmailResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const requestOptions: ResendRequestOptionsWithSignal = {
    idempotencyKey,
    signal: controller.signal,
  };

  try {
    return await resend.emails.send(email, requestOptions);
  } finally {
    clearTimeout(timeout);
  }
}
