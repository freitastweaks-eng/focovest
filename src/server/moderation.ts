import { SUPABASE_URL } from "@/integrations/supabase/project";

const MAX_BODY_BYTES = 9 * 1024 * 1024;
const OPENAI_MODERATION_URL = "https://api.openai.com/v1/moderations";
const MODERATION_MODEL = process.env.OPENAI_MODERATION_MODEL ?? "omni-moderation-latest";

type ModerationInput = {
  text?: string;
  imageDataUrl?: string | null;
};

type ModerationResult = {
  flagged?: boolean;
  categories?: Record<string, boolean>;
  category_scores?: Record<string, number>;
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function getBearerToken(value: string | null) {
  const match = value?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

async function getSupabaseUserFromAccessToken(accessToken: string | null) {
  if (!accessToken) return null;

  const headers: Record<string, string> = { Authorization: `Bearer ${accessToken}` };
  if (process.env.SUPABASE_PUBLISHABLE_KEY) {
    headers.apikey = process.env.SUPABASE_PUBLISHABLE_KEY;
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers });
  if (!response.ok) return null;
  return (await response.json()) as { id: string; email?: string };
}

function normalizeBody(raw: unknown): ModerationInput | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const body = raw as Record<string, unknown>;
  const text = typeof body.text === "string" ? body.text.slice(0, 8000) : "";
  const imageDataUrl = typeof body.imageDataUrl === "string" ? body.imageDataUrl : null;

  if (!text.trim() && !imageDataUrl) return null;
  if (imageDataUrl && !/^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(imageDataUrl)) {
    return null;
  }

  return { text, imageDataUrl };
}

function categoriesFrom(result: ModerationResult | undefined) {
  if (!result?.categories) return [];
  return Object.entries(result.categories)
    .filter(([, blocked]) => blocked)
    .map(([category]) => category);
}

export async function handleModerationRequest(request: Request) {
  if (request.method !== "POST") {
    return jsonResponse({ status: "error", message: "Method not allowed." }, 405);
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return jsonResponse({ status: "error", message: "Arquivo grande demais para moderacao." }, 413);
  }

  const user = await getSupabaseUserFromAccessToken(
    getBearerToken(request.headers.get("authorization")),
  );
  if (!user) {
    return jsonResponse({ status: "error", message: "Authentication required." }, 401);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return jsonResponse(
      { status: "error", message: "Moderacao com IA ainda nao esta configurada." },
      503,
    );
  }

  let payload: ModerationInput | null = null;
  try {
    const rawText = await request.text();
    if (rawText.length > MAX_BODY_BYTES) {
      return jsonResponse(
        { status: "error", message: "Arquivo grande demais para moderacao." },
        413,
      );
    }
    payload = normalizeBody(JSON.parse(rawText));
  } catch {
    return jsonResponse({ status: "error", message: "Invalid moderation payload." }, 400);
  }

  if (!payload) {
    return jsonResponse({ status: "error", message: "Conteudo invalido para moderacao." }, 400);
  }

  const input: Array<Record<string, unknown>> = [];
  if (payload.text?.trim()) {
    input.push({ type: "text", text: payload.text });
  }
  if (payload.imageDataUrl) {
    input.push({ type: "image_url", image_url: { url: payload.imageDataUrl } });
  }

  const response = await fetch(OPENAI_MODERATION_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODERATION_MODEL, input }),
  });

  if (!response.ok) {
    return jsonResponse({ status: "error", message: "Nao foi possivel moderar o conteudo." }, 502);
  }

  const data = (await response.json()) as { results?: ModerationResult[] };
  const results = data.results ?? [];
  const flagged = results.some((result) => result.flagged);
  const categories = [...new Set(results.flatMap(categoriesFrom))];

  return jsonResponse({
    status: "success",
    allowed: !flagged,
    categories,
  });
}
