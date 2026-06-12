import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Flag, ChevronLeft, ChevronRight, X, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export const Route = createFileRoute("/simulados/$id")({ component: SimuladoExam });

type Q = {
  id: string;
  question_number: number;
  subject: string | null;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  correct_answer: "A" | "B" | "C" | "D" | "E";
  explanation: string;
};
type Sim = {
  id: string;
  title: string;
  time_limit_minutes: number;
  total_questions: number;
  vestibular: string;
};

const LETTERS = ["A", "B", "C", "D", "E"] as const;

function SimuladoExam() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sim, setSim] = useState<Sim | null>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, "A" | "B" | "C" | "D" | "E">>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [remaining, setRemaining] = useState(0);
  const [paused, setPaused] = useState(false);
  const [submitted, setSubmitted] = useState<null | { score: number; pct: number; spent: number }>(
    null,
  );
  const [avgPct, setAvgPct] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: qs }] = await Promise.all([
        supabase.from("simulados").select("*").eq("id", id).single(),
        supabase
          .from("simulado_questions")
          .select("*")
          .eq("simulado_id", id)
          .order("question_number"),
      ]);
      if (s) {
        setSim(s as Sim);
        setRemaining(s.time_limit_minutes * 60);
      }
      setQuestions((qs as Q[]) || []);
    })();
  }, [id]);

  useEffect(() => {
    if (paused || submitted || remaining <= 0) return;
    const t = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(t);
  }, [paused, submitted, remaining]);

  useEffect(() => {
    const q = questions[current];
    if (q) setVisited((v) => new Set(v).add(q.id));
  }, [current, questions]);

  const q = questions[current];
  const totalTimeSec = (sim?.time_limit_minutes || 0) * 60;

  function chooseAnswer(letter: "A" | "B" | "C" | "D" | "E") {
    if (!q) return;
    setAnswers((a) => ({ ...a, [q.id]: letter }));
  }
  function toggleFlag() {
    if (!q) return;
    setFlagged((f) => {
      const n = new Set(f);
      if (n.has(q.id)) {
        n.delete(q.id);
      } else {
        n.add(q.id);
      }
      return n;
    });
  }

  const handleSubmit = useCallback(async () => {
    if (!sim || submitted) return;
    let score = 0;
    questions.forEach((qq) => {
      if (answers[qq.id] === qq.correct_answer) score++;
    });
    const pct = questions.length ? (score / questions.length) * 100 : 0;
    const spent = Math.max(1, Math.round((totalTimeSec - remaining) / 60));
    setSubmitted({ score, pct, spent });

    if (user) {
      await supabase.from("simulado_results").insert({
        user_id: user.id,
        simulado_id: sim.id,
        score,
        total_questions: questions.length,
        percentage: pct,
        time_spent_minutes: spent,
        answers,
      });
    }

    const { data: percentile } = await supabase.rpc("get_simulado_percentile", {
      _simulado_id: sim.id,
      _percentage: pct,
    });
    if (percentile !== null) {
      setAvgPct(Math.round(Number(percentile)));
    }
  }, [sim, questions, answers, user, submitted, totalTimeSec, remaining]);

  useEffect(() => {
    if (remaining === 0 && sim && !submitted) handleSubmit();
  }, [remaining, sim, submitted, handleSubmit]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  if (!sim || questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="size-10 animate-spin rounded-full border-2 border-lime border-t-transparent" />
      </div>
    );
  }

  if (submitted)
    return (
      <ResultsView
        sim={sim}
        questions={questions}
        answers={answers}
        result={submitted}
        betterThanPct={avgPct}
        onRetry={() => navigate({ to: "/simulados/$id", params: { id: sim.id } })}
        onBack={() => navigate({ to: "/simulados" })}
      />
    );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <button
          onClick={() => navigate({ to: "/simulados" })}
          className="press rounded-lg p-2 hover:bg-secondary"
        >
          <X className="size-4" />
        </button>
        <div className="min-w-0 flex-1 px-4 text-center">
          <div className="truncate text-xs text-muted-foreground">{sim.vestibular}</div>
          <div className="truncate text-sm font-semibold">{sim.title}</div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-mono text-sm font-bold tabular-nums",
              remaining < 300 && "border-red-500/40 bg-red-500/10 text-red-500",
            )}
          >
            <Clock className="size-4" />
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          <button
            onClick={() => setPaused((p) => !p)}
            className="press rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold"
          >
            {paused ? "Retomar" : "Pausar"}
          </button>
          <button
            onClick={handleSubmit}
            className="press rounded-lg bg-lime px-3 py-1.5 text-xs font-bold text-lime-foreground"
          >
            Entregar
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_280px] overflow-hidden">
        <div className="flex flex-col overflow-y-auto p-4 md:p-8">
          <div className="mx-auto w-full max-w-3xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-lime">
                Questão {current + 1} de {questions.length}
                {q.subject && ` · ${q.subject}`}
              </span>
              <button
                onClick={toggleFlag}
                className={cn(
                  "press inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs",
                  flagged.has(q.id)
                    ? "border-amber-500 bg-amber-500/10 text-amber-500"
                    : "border-border",
                )}
              >
                <Flag className="size-3.5" />{" "}
                {flagged.has(q.id) ? "Marcada" : "Marcar para revisão"}
              </button>
            </div>
            <h2 className="mb-6 font-display text-xl font-medium leading-snug md:text-2xl">
              {q.question_text}
            </h2>
            <div className="space-y-2">
              {LETTERS.map((L) => {
                const text = q[`option_${L.toLowerCase()}` as keyof Q] as string;
                const selected = answers[q.id] === L;
                return (
                  <button
                    key={L}
                    onClick={() => chooseAnswer(L)}
                    className={cn(
                      "press flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition",
                      selected
                        ? "border-lime bg-lime/10"
                        : "border-border bg-card hover:bg-secondary/50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                        selected ? "bg-lime text-lime-foreground" : "bg-secondary",
                      )}
                    >
                      {L}
                    </span>
                    <span className="text-sm leading-relaxed">{text}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
                className="press inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold disabled:opacity-40"
              >
                <ChevronLeft className="size-4" /> Anterior
              </button>
              <button
                onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
                disabled={current === questions.length - 1}
                className="press inline-flex items-center gap-1 rounded-lg bg-lime px-4 py-2 text-sm font-bold text-lime-foreground disabled:opacity-40"
              >
                Próxima <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>

        <aside className="hidden border-l border-border bg-card/30 p-4 lg:block">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Navegador
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((qq, i) => {
              const isAns = answers[qq.id];
              const isFlag = flagged.has(qq.id);
              const isVis = visited.has(qq.id);
              const isCur = i === current;
              return (
                <button
                  key={qq.id}
                  onClick={() => setCurrent(i)}
                  className={cn(
                    "press relative flex aspect-square items-center justify-center rounded-lg text-xs font-bold transition",
                    isCur && "ring-2 ring-lime",
                    isAns
                      ? "bg-lime text-lime-foreground"
                      : isVis
                        ? "bg-secondary text-foreground"
                        : "bg-card border border-border text-muted-foreground",
                  )}
                >
                  {i + 1}
                  {isFlag && (
                    <span className="absolute -right-1 -top-1 size-2 rounded-full bg-amber-500" />
                  )}
                </button>
              );
            })}
          </div>
          <Legend />
        </aside>
      </div>

      <AnimatePresence>
        {paused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur"
          >
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <div className="mb-3 font-display text-2xl font-semibold">Pausado</div>
              <p className="mb-4 text-sm text-muted-foreground">
                Cronômetro parado. Respire e volte quando estiver pronto.
              </p>
              <button
                onClick={() => setPaused(false)}
                className="press rounded-xl bg-lime px-6 py-2 font-bold text-lime-foreground"
              >
                Retomar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-4 space-y-1.5 text-[11px] text-muted-foreground">
      <div className="flex items-center gap-2">
        <span className="size-3 rounded bg-lime" /> Respondida
      </div>
      <div className="flex items-center gap-2">
        <span className="size-3 rounded bg-secondary" /> Visitada
      </div>
      <div className="flex items-center gap-2">
        <span className="size-3 rounded border border-border" /> Não visitada
      </div>
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-amber-500" /> Marcada
      </div>
    </div>
  );
}

function ResultsView({
  sim,
  questions,
  answers,
  result,
  betterThanPct,
  onRetry,
  onBack,
}: {
  sim: Sim;
  questions: Q[];
  answers: Record<string, "A" | "B" | "C" | "D" | "E">;
  result: { score: number; pct: number; spent: number };
  betterThanPct: number | null;
  onRetry: () => void;
  onBack: () => void;
}) {
  const bySubject = useMemo(() => {
    const map: Record<string, { right: number; total: number }> = {};
    questions.forEach((q) => {
      const k = q.subject || "Geral";
      map[k] = map[k] || { right: 0, total: 0 };
      map[k].total++;
      if (answers[q.id] === q.correct_answer) map[k].right++;
    });
    return Object.entries(map).map(([subject, v]) => ({
      subject,
      pct: Math.round((v.right / v.total) * 100),
    }));
  }, [questions, answers]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="press inline-flex items-center gap-1 text-sm text-muted-foreground"
          >
            <X className="size-4" /> Fechar
          </button>
        </div>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-3xl border border-border bg-card p-8 text-center"
        >
          <div className="text-xs font-bold uppercase tracking-wider text-lime">Resultado</div>
          <h1 className="mt-2 font-display text-5xl font-bold tabular-nums">
            {result.score}
            <span className="text-muted-foreground">/{questions.length}</span>
          </h1>
          <div className="mt-1 font-display text-3xl font-semibold text-lime tabular-nums">
            {Math.round(result.pct)}%
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{sim.title}</p>
          {betterThanPct !== null && (
            <p className="mt-3 text-sm">
              Você foi melhor que <span className="font-bold text-lime">{betterThanPct}%</span> dos
              usuários.
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Tempo: {result.spent} min · {((result.spent * 60) / questions.length).toFixed(0)}s por
            questão
          </p>
        </motion.div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 font-display text-lg font-semibold">Desempenho por matéria</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySubject}>
                <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                  {bySubject.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.pct >= 70 ? "#B8FF4F" : d.pct >= 50 ? "#fbbf24" : "#ef4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <h3 className="font-display text-lg font-semibold">Revisão das questões</h3>
          {questions.map((q, i) => {
            const user = answers[q.id];
            const ok = user === q.correct_answer;
            return (
              <div key={q.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-2 flex items-center gap-2 text-xs">
                  <span className="font-bold">Questão {i + 1}</span>
                  {ok ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-lime/15 px-2 py-0.5 text-lime">
                      <CheckCircle2 className="size-3" /> Correta
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-red-500">
                      <XCircle className="size-3" /> {user ? "Errada" : "Em branco"}
                    </span>
                  )}
                </div>
                <p className="text-sm">{q.question_text}</p>
                <div className="mt-3 space-y-1.5 text-sm">
                  {LETTERS.map((L) => {
                    const txt = q[`option_${L.toLowerCase()}` as keyof Q] as string;
                    const isCorrect = L === q.correct_answer;
                    const isUser = L === user;
                    return (
                      <div
                        key={L}
                        className={cn(
                          "rounded-lg border px-3 py-2",
                          isCorrect && "border-lime bg-lime/10",
                          isUser && !isCorrect && "border-red-500 bg-red-500/10",
                          !isCorrect && !isUser && "border-border",
                        )}
                      >
                        <strong>{L})</strong> {txt}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 rounded-xl bg-secondary/50 p-3 text-xs leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">Explicação:</strong> {q.explanation}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={onRetry}
            className="press rounded-xl bg-lime px-5 py-2.5 font-bold text-lime-foreground"
          >
            Refazer simulado
          </button>
          <button
            onClick={onBack}
            className="press rounded-xl border border-border bg-card px-5 py-2.5 font-semibold"
          >
            Ver outros simulados
          </button>
        </div>
      </div>
    </div>
  );
}
