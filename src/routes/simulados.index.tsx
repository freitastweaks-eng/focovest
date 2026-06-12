import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Clock, Target, Play, History, Sparkles } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/simulados/")({ component: SimuladosPage });

type Simulado = {
  id: string;
  title: string;
  vestibular: string;
  subject: string | null;
  total_questions: number;
  time_limit_minutes: number;
  difficulty: string;
};

type Result = {
  id: string;
  simulado_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  time_spent_minutes: number | null;
  completed_at: string;
};

const FILTERS = ["Todos", "ENEM", "FUVEST", "UNICAMP", "UNESP", "Vunesp", "Mackenzie"];

function SimuladosPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("Todos");
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [avgByExam, setAvgByExam] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const { data: sims } = await supabase.from("simulados").select("*").order("title");
      setSimulados((sims as Simulado[]) || []);
      if (user) {
        const { data: rs } = await supabase
          .from("simulado_results")
          .select("*")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false });
        setResults((rs as Result[]) || []);
      }
      const avg: Record<string, number> = {};
      await Promise.all(
        ((sims as Simulado[]) || []).map(async (sim) => {
          const { data } = await supabase.rpc("get_simulado_aggregate", { _simulado_id: sim.id });
          const aggregate = data?.[0];
          if (aggregate && Number(aggregate.total_attempts) > 0) {
            avg[sim.id] = Math.round(Number(aggregate.avg_percentage));
          }
        }),
      );
      setAvgByExam(avg);
    })();
  }, [user]);

  const filtered = simulados.filter((s) => filter === "Todos" || s.vestibular === filter);
  const simById = (id: string) => simulados.find((s) => s.id === id);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Simulados"
        title="Teste seu preparo"
        description="Provas no estilo real para você cronometrar e medir sua evolução."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "press rounded-full border px-4 py-1.5 text-xs font-semibold transition",
              filter === f
                ? "border-lime bg-lime text-lime-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="lift rounded-2xl border border-border bg-card p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-lime/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-lime">
                {s.vestibular}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {s.difficulty}
              </span>
            </div>
            <h3 className="font-display text-lg font-semibold leading-snug">{s.title}</h3>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Target className="size-3.5" /> {s.total_questions} questões
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" /> {s.time_limit_minutes} min
              </span>
            </div>
            {avgByExam[s.id] !== undefined && (
              <div className="mt-2 text-[11px] text-muted-foreground">
                Média da galera:{" "}
                <span className="font-semibold text-foreground">{avgByExam[s.id]}%</span>
              </div>
            )}
            <Link
              to="/simulados/$id"
              params={{ id: s.id }}
              className="press mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-lime px-4 py-2 text-sm font-bold text-lime-foreground"
            >
              <Play className="size-4" /> Iniciar simulado
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold">
          <History className="size-5 text-lime" /> Meus simulados
        </h2>
        {results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            <Sparkles className="mx-auto mb-2 size-5 text-lime" />
            Faça seu primeiro simulado e acompanhe seu progresso aqui.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {results.map((r) => {
              const s = simById(r.simulado_id);
              return (
                <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{s?.title || "Simulado"}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {new Date(r.completed_at).toLocaleString("pt-BR")} ·{" "}
                        {r.time_spent_minutes ?? "—"} min
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-2xl font-semibold tabular-nums text-lime">
                        {Math.round(Number(r.percentage))}%
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {r.score}/{r.total_questions}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
