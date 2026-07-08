type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
};

function shouldSendRemoteIp(remoteIp: string | null): remoteIp is string {
  if (!remoteIp) {
    return false;
  }

  return remoteIp !== "127.0.0.1" && remoteIp !== "::1";
}

export async function verifyTurnstileToken(
  token: string,
  remoteIp: string | null
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!secret) {
    console.error("[contact] Missing TURNSTILE_SECRET_KEY.");
    return false;
  }

  const params = new URLSearchParams({
    secret,
    response: token,
  });

  if (shouldSendRemoteIp(remoteIp)) {
    params.set("remoteip", remoteIp);
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const result = (await response.json()) as TurnstileVerifyResponse;

    if (result.success === true) {
      return true;
    }

    console.error(
      "[contact] Turnstile verification failed:",
      result["error-codes"]?.join(", ") ?? `HTTP ${response.status}`
    );
    return false;
  } catch (error) {
    console.error("[contact] Turnstile verify error:", error);
    return false;
  }
}
