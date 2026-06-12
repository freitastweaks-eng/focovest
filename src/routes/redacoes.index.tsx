import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Star } from "lucide-react";
import { ESSAYS } from "@/lib/data";

export const Route = createFileRoute("/redacoes/")({ component: ModelosPage });

function ModelosPage() {
  const enem = ESSAYS.filter((e) => e.vestibular === "ENEM");
  const fuvest = ESSAYS.filter((e) => e.vestibular === "FUVEST");
  const unicamp = ESSAYS.filter((e) => e.vestibular === "UNICAMP");

  return (
    <div className="space-y-10">
      <Section title="ENEM — Nota 1000" essays={enem} maxScore={1000} />
      <Section title="FUVEST" essays={fuvest} maxScore={50} />
      <Section title="UNICAMP" essays={unicamp} maxScore={30} />
    </div>
  );
}

function Section({
  title,
  essays,
  maxScore,
}: {
  title: string;
  essays: typeof ESSAYS;
  maxScore: number;
}) {
  return (
    <section>
      <h2 className="mb-4 font-display text-2xl font-semibold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {essays.map((e, i) => {
          const words = e.body.trim().split(/\s+/).length;
          const reading = Math.max(1, Math.round(words / 200));
          return (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="lift flex flex-col rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {e.year}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-lime/15 px-2 py-0.5 text-[11px] font-bold text-lime">
                  <Star className="size-3 fill-lime" />
                  {e.score}
                  {maxScore !== 1000 && <span className="opacity-60">/{maxScore}</span>}
                </span>
              </div>
              <h3 className="mt-3 font-display text-base font-semibold leading-tight">{e.theme}</h3>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{words} palavras</span>
                <span>·</span>
                <span>{reading} min de leitura</span>
              </div>
              <Link
                to="/redacoes/$id"
                params={{ id: e.id }}
                className="mt-5 inline-flex items-center justify-center rounded-xl bg-secondary/60 px-3 py-2 text-sm font-medium hover:bg-secondary"
              >
                Ler redação completa
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
