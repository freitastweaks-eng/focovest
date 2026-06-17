const BLOCKED_TEXT_PATTERNS = [
  /\b(porn[oô]?|sexo\s*expl[ií]cito|nude|nudes|xxx)\b/i,
  /\b(estupro|pedofil(?:ia|o)|abuso\s+sexual)\b/i,
  /\b(matar|suic[ií]dio|automutila[cç][aã]o)\b/i,
  /\b(coca[ií]na|crack|metanfetamina|vender\s+droga)\b/i,
];

export function assertSafeCommunityText(...values: Array<string | null | undefined>) {
  const text = values.filter(Boolean).join(" ").normalize("NFKC");
  if (!text.trim()) return;

  if (BLOCKED_TEXT_PATTERNS.some((pattern) => pattern.test(text))) {
    throw new Error("Conteudo bloqueado por seguranca. Revise o texto antes de publicar.");
  }
}
