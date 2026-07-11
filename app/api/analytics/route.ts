import { parseAnalyticsEvent } from "@/lib/analytics";
import { incrementAnalytics } from "@/lib/analytics-db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return Response.json({ error: "JSON 요청만 허용됩니다." }, { status: 415 });
  }

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const event = parseAnalyticsEvent(body);
  if (!event) {
    return Response.json({ error: "집계 항목이 올바르지 않습니다." }, { status: 400 });
  }

  try {
    await incrementAnalytics(event);
    return new Response(null, {
      status: 204,
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "집계를 일시적으로 기록하지 못했습니다." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
