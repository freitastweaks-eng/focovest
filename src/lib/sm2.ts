// SM-2 simplificado: rating → próximo intervalo em dias
export type Rating = "forgotten" | "hard" | "good" | "easy";

export function nextInterval(rating: Rating): number {
  switch (rating) {
    case "forgotten":
      return 1;
    case "hard":
      return 3;
    case "good":
      return 7;
    case "easy":
      return 14;
  }
}

export function nextReviewDate(rating: Rating): string {
  const d = new Date();
  d.setDate(d.getDate() + nextInterval(rating));
  return d.toISOString().slice(0, 10);
}

export function isDue(nextDate: string | null | undefined): boolean {
  if (!nextDate) return true;
  return nextDate <= new Date().toISOString().slice(0, 10);
}
