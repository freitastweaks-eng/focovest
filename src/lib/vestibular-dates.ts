// Datas oficiais dos vestibulares 2025/2026
export const VESTIBULAR_DATES: Record<string, { name: string; date: string; emoji: string }> = {
  ENEM: { name: "ENEM 2025", date: "2025-11-09", emoji: "📝" },
  FUVEST: { name: "FUVEST 2026", date: "2025-11-23", emoji: "🎓" },
  UNICAMP: { name: "UNICAMP 2026", date: "2025-10-26", emoji: "🏛️" },
  UNESP: { name: "UNESP 2026", date: "2025-11-16", emoji: "📚" },
  Vunesp: { name: "Vunesp 2026", date: "2025-11-16", emoji: "✏️" },
  Mackenzie: { name: "Mackenzie 2026", date: "2025-11-09", emoji: "🏫" },
};

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00").getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((target - now) / 86400000));
}

export function motivationalPhrase(days: number): string {
  if (days > 180) return "Você tem tempo. Comece forte.";
  if (days > 90) return "O momento de acelerar é agora.";
  if (days > 30) return "Reta final. Cada hora conta.";
  if (days > 0) return "Você está quase lá. Não pare agora.";
  return "Hora do vestibular! Boa sorte. 🍀";
}
