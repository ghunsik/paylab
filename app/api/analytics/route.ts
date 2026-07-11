import { parseAnalyticsEvent } from "@/lib/analytics";
import { incrementAnalytics } from "@/lib/analytics-db";
import { analyticsRateLimiter } from "@/lib/analytics-rate-limit";
import { isSameOriginAnalyticsRequest, readLimitedJson } from "@/lib/analytics-request";

export const dynamic = "force-dynamic";

const API_HEADERS = {
  "cache-control": "no-store",
  "cross-origin-resource-policy": "same-origin",
  vary: "Origin",
};

function jsonError(error: string, status: number, headers?: HeadersInit) {
  return Response.json(
    { error },
    { status, headers: { ...API_HEADERS, ...headers } },
  );
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.split(";", 1)[0]?.trim().toLowerCase() !== "application/json") {
    return jsonError("JSON 요청만 허용됩니다.", 415);
  }

  if (!isSameOriginAnalyticsRequest(request)) {
    return jsonError("허용되지 않은 요청입니다.", 403);
  }

  const bodyResult = await readLimitedJson(request);
  if (!bodyResult.ok) {
    return jsonError(
      bodyResult.reason === "too-large"
        ? "요청 크기가 너무 큽니다."
        : "요청 형식이 올바르지 않습니다.",
      bodyResult.reason === "too-large" ? 413 : 400,
    );
  }

  const event = parseAnalyticsEvent(bodyResult.value);
  if (!event) {
    return jsonError("집계 항목이 올바르지 않습니다.", 400);
  }

  if (!analyticsRateLimiter.tryConsume()) {
    return jsonError("요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.", 429, {
      "retry-after": String(analyticsRateLimiter.retryAfterSeconds()),
    });
  }

  try {
    await incrementAnalytics(event);
    return new Response(null, {
      status: 204,
      headers: API_HEADERS,
    });
  } catch {
    return jsonError("집계를 일시적으로 기록하지 못했습니다.", 503);
  }
}
