import { supabase } from "@/integrations/supabase/client";

const MODERATED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type ModerationResponse = {
  status?: string;
  allowed?: boolean;
  message?: string;
  categories?: string[];
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Nao foi possivel ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

export async function assertAiModerationAllowed({
  text,
  file,
}: {
  text: string;
  file?: File | null;
}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Faca login para publicar.");
  }

  const imageDataUrl =
    file && MODERATED_IMAGE_TYPES.has(file.type) ? await fileToDataUrl(file) : null;
  const response = await fetch("/api/moderation/check", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, imageDataUrl }),
  });

  const payload = (await response.json().catch(() => null)) as ModerationResponse | null;
  if (!response.ok) {
    throw new Error(payload?.message || "Nao foi possivel verificar a seguranca do conteudo.");
  }

  if (!payload?.allowed) {
    const categories = payload?.categories?.length ? ` (${payload.categories.join(", ")})` : "";
    throw new Error(`Conteudo bloqueado pela moderacao com IA${categories}.`);
  }
}
