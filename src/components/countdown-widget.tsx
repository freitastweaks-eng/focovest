import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { CalendarDays } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { VESTIBULAR_DATES, daysUntil, motivationalPhrase } from "@/lib/vestibular-dates";

export function CountdownWidget() {
  const { profile } = useAuth();
  const key =
    profile?.vestibular && VESTIBULAR_DATES[profile.vestibular] ? profile.vestibular : "ENEM";
  const info = VESTIBULAR_DATES[key];
  const days = daysUntil(info.date);
  const phrase = motivationalPhrase(days);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-lime/30 bg-gradient-to-br from-lime/10 via-card to-card p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-lime">
            Contagem regressiva
          </div>
          <h2 className="mt-1 font-display text-xl font-semibold sm:text-2xl">
            {info.emoji} {info.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{phrase}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-5xl font-bold tabular-nums text-lime sm:text-6xl">
            {days}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            dias
          </div>
        </div>
      </div>
      <Link
        to="/calendario"
        className="press mt-4 inline-flex items-center gap-1 text-xs font-semibold text-lime hover:underline"
      >
        <CalendarDays className="size-3.5" /> Ver no calendário
      </Link>
    </motion.div>
  );
}
