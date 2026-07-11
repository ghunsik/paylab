export const CANONICAL_ORIGIN = "https://paylab.kr";

const PAYLAB_HTTPS_HOSTS = new Set(["paylab.kr", "www.paylab.kr"]);
const SAFE_REDIRECT_METHODS = new Set(["GET", "HEAD"]);

export function buildContentSecurityPolicy(nonce: string): string {
  if (!/^[A-Za-z0-9]+$/.test(nonce)) {
    throw new TypeError("CSP nonce contains unsupported characters.");
  }

  return [
    "default-src 'none'",
    `script-src 'self' 'nonce-${nonce}'`,
    "script-src-attr 'none'",
    "style-src 'self'",
    "style-src-attr 'none'",
    "img-src 'self'",
    "font-src 'self'",
    "connect-src 'self'",
    "form-action 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-src 'none'",
    "worker-src 'none'",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function createContentSecurityNonce(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

export function canonicalOriginResponse(
  request: Request,
  enforceCanonicalOrigin: boolean,
): Response | null {
  if (!enforceCanonicalOrigin) return null;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin === CANONICAL_ORIGIN) return null;

  if (!SAFE_REDIRECT_METHODS.has(request.method.toUpperCase())) {
    return new Response(null, { status: 421 });
  }

  const location = new URL(`${requestUrl.pathname}${requestUrl.search}`, CANONICAL_ORIGIN);
  return new Response(null, {
    status: 308,
    headers: {
      "cache-control": "public, max-age=300",
      location: location.toString(),
    },
  });
}

export function requestWithContentSecurityPolicy(
  request: Request,
  policy: string,
): Request {
  const headers = new Headers(request.headers);
  headers.set("content-security-policy", policy);
  return new Request(request, { headers });
}

export function responseWithSecurityHeaders(
  response: Response,
  policy: string,
  requestUrl: URL,
): Response {
  const headers = new Headers(response.headers);
  headers.set("content-security-policy", policy);
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  headers.set("referrer-policy", "no-referrer");
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("x-xss-protection", "0");

  if (requestUrl.protocol === "https:" && PAYLAB_HTTPS_HOSTS.has(requestUrl.hostname)) {
    headers.set("strict-transport-security", "max-age=31536000");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
