import { createHash, randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "./supabase-server";

const MAX_BODY_BYTES = 12_000;
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function clean(value: unknown, max: number) {
  return typeof value === "string"
    ? value
        .replace(/[\r\n\t]+/g, " ")
        .trim()
        .slice(0, max)
    : "";
}

function requestKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return createHash("sha256").update(forwarded).digest("hex").slice(0, 32);
}

function allowRequest(key: string) {
  const now = Date.now();
  const current = rateLimits.get(key);
  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (current.count >= 10) return false;
  current.count += 1;
  return true;
}

export async function handleMonitoringRequest(request: Request) {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  const key = requestKey(request);
  if (!allowRequest(key)) return new Response(null, { status: 429 });

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) return new Response(null, { status: 413 });

  let payload: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return new Response(null, { status: 413 });
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return new Response(null, { status: 400 });
  }

  const message = clean(payload.message, 1_000);
  if (!message) return new Response(null, { status: 400 });

  try {
    await getSupabaseAdmin()
      .from("app_error_events")
      .insert({
        id: randomUUID(),
        source: clean(payload.source, 40) || "client",
        message,
        stack: clean(payload.stack, 4_000) || null,
        route: clean(payload.route, 500) || null,
        user_agent: clean(request.headers.get("user-agent"), 500) || null,
        request_hash: key,
        release: clean(process.env.VERCEL_GIT_COMMIT_SHA, 80) || null,
      });
  } catch (error) {
    console.error("Failed to persist monitoring event", error);
  }

  return new Response(null, { status: 204 });
}
