import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Library, ArrowRight } from "lucide-react";
import { THEMES } from "@/lib/data";

export const Route = createFileRoute("/redacoes/temas")({ component: TemasPage });

function TemasPage() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {THEMES.map((t, i) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.025 }}
          className="lift rounded-2xl border border-border bg-card p-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recorrência
            </span>
            <span className="font-display text-sm font-bold text-lime">{t.recurrence}%</span>
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-secondary">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${t.recurrence}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-lime"
            />
          </div>
          <h3 className="font-display text-lg font-semibold leading-tight">{t.title}</h3>
          <div className="mt-2 flex flex-wrap gap-1">
            {t.subjects.map((s) => (
              <span
                key={s}
                className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                {s}
              </span>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Link
              to="/biblioteca"
              className="press flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-xs font-semibold hover:bg-secondary"
            >
              <Library className="size-3.5" /> Repertório
            </Link>
            <Link
              to="/redacoes/escrever"
              search={{ theme: t.title, id: undefined }}
              className="press flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-lime px-3 py-2 text-xs font-bold text-lime-foreground"
            >
              Escrever <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
