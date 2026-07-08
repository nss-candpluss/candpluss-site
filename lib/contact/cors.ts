const DEFAULT_ALLOWED_ORIGINS = ["https://candpluss.camp"];

function getAllowedOrigins(): string[] {
  const configured = process.env.CONTACT_CORS_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configured && configured.length > 0 ? configured : DEFAULT_ALLOWED_ORIGINS;
}

export function getContactCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin");

  if (!origin || !getAllowedOrigins().includes(origin)) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export function withContactCorsHeaders(request: Request, init?: ResponseInit): ResponseInit {
  return {
    ...init,
    headers: {
      ...getContactCorsHeaders(request),
      ...(init?.headers ?? {}),
    },
  };
}
