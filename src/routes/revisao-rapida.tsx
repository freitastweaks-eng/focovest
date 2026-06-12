import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, ArrowLeft, CheckCircle2, XCircle, RotateCw } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SUBJECTS, VESTIBULARES, type Difficulty } from "@/lib/data";
import { cn } from "@/lib/utils";

const DIFFICULTY_OPTIONS = ["Todas", "Fácil", "Médio", "Difícil"] as const;
type DifficultyOption = (typeof DIFFICULTY_OPTIONS)[number];

export const Route = createFileRoute("/revisao-rapida")({ component: QuickReviewPage });

type Q = {
  id: string;
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
type Stage = "setup" | "quiz" | "done";
const LETTERS = ["A", "B", "C", "D", "E"] as const;

function QuickReviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("setup");
  const [subject, setSubject] = useState<string>("Todas");
  const [vestibular, setVestibular] = useState<string>("ENEM");
  const [difficulty, setDifficulty] = useState<DifficultyOption>("Todas");

  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(0);

  async function start() {
    let query = supabase.from("simulado_questions").select("*").limit(50);
    if (subject !== "Todas") query = query.eq("subject", subject);
    const { data } = await query;
    let pool = (data as Q[]) || [];
    if (pool.length === 0) {
      const { data: fallback } = await supabase.from("simulado_questions").select("*").limit(50);
      pool = (fallback as Q[]) || [];
    }
    pool = pool.sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(pool);
    setIdx(0);
    setAnswers({});
    setPicked(null);
    setStartedAt(Date.now());
    setStage("quiz");
  }

  const q = questions[idx];

  function choose(L: string) {
    if (picked || !q) return;
    setPicked(L);
    setAnswers((a) => ({ ...a, [q.id]: L }));
  }
  function nextQ() {
    if (idx + 1 >= questions.length) finish();
    else {
      setPicked(null);
      setIdx(idx + 1);
    }
  }

  async function finish() {
    const score = questions.filter((qq) => answers[qq.id] === qq.correct_answer).length;
    const time = Math.round((Date.now() - startedAt) / 1000);
    if (user) {
      await supabase.from("quick_review_results").insert({
        user_id: user.id,
        subject: subject === "Todas" ? "Geral" : subject,
        score,
        total: questions.length,
        time_seconds: time,
      });
    }
    setStage("done");
  }

  if (stage === "setup") {
    return (
      <PageContainer className="max-w-2xl">
        <PageHeader
          eyebrow="Revisão Rápida"
          title="10 questões. Foco total."
          description="Quiz instantâneo com feedback imediato para revisar o que você sabe."
        />
        <div className="rounded-3xl border border-border bg-card p-6">
          <Field label="Matéria">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
            >
              <option>Todas</option>
              {SUBJECTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Vestibular">
            <select
              value={vestibular}
              onChange={(e) => setVestibular(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
            >
              {VESTIBULARES.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Dificuldade">
            <div className="flex gap-2">
              {DIFFICULTY_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "press rounded-xl border px-3 py-1.5 text-xs font-semibold",
                    difficulty === d
                      ? "border-lime bg-lime text-lime-foreground"
                      : "border-border bg-card",
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>
          <button
            onClick={start}
            className="press mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lime py-3 font-bold text-lime-foreground"
          >
            <Zap className="size-5" /> Iniciar revisão
          </button>
        </div>
      </PageContainer>
    );
  }

  if (stage === "done") {
    const score = questions.filter((qq) => answers[qq.id] === qq.correct_answer).length;
    const pct = Math.round((score / questions.length) * 100);
    const time = Math.round((Date.now() - startedAt) / 1000);
    return (
      <PageContainer className="max-w-2xl">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-3xl border border-border bg-card p-8 text-center"
        >
          <div className="font-display text-5xl font-bold tabular-nums">
            {score}/{questions.length}
          </div>
          <div className="mt-1 font-display text-2xl font-semibold text-lime tabular-nums">
            {pct}%
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {Math.floor(time / 60)}min {time % 60}s
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              onClick={start}
              className="press inline-flex items-center gap-1.5 rounded-xl bg-lime px-4 py-2 font-bold text-lime-foreground"
            >
              <RotateCw className="size-4" /> Refazer
            </button>
            <button
              onClick={() => setStage("setup")}
              className="press rounded-xl border border-border bg-card px-4 py-2 font-semibold"
            >
              Nova revisão
            </button>
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="press rounded-xl border border-border bg-card px-4 py-2 font-semibold"
            >
              Voltar
            </button>
          </div>
        </motion.div>
        <details className="mt-6 rounded-2xl border border-border bg-card p-5">
          <summary className="cursor-pointer font-semibold">Ver respostas</summary>
          <div className="mt-3 space-y-3">
            {questions.map((qq, i) => {
              const user = answers[qq.id];
              const ok = user === qq.correct_answer;
              return (
                <div key={qq.id} className="rounded-xl border border-border p-3 text-sm">
                  <div className="mb-1 flex items-center gap-2 text-xs">
                    <span className="font-bold">#{i + 1}</span>
                    {ok ? (
                      <CheckCircle2 className="size-4 text-lime" />
                    ) : (
                      <XCircle className="size-4 text-red-500" />
                    )}
                  </div>
                  <p>{qq.question_text}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Resposta correta: <strong className="text-lime">{qq.correct_answer}</strong> ·{" "}
                    {qq.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </details>
      </PageContainer>
    );
  }

  if (!q) return null;
  const ok = picked === q.correct_answer;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <button
          onClick={() => setStage("setup")}
          className="press rounded-lg p-2 hover:bg-secondary"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="text-sm font-semibold">Revisão Rápida</div>
        <div className="text-xs tabular-nums text-muted-foreground">
          {idx + 1}/{questions.length}
        </div>
      </header>
      <div className="h-1 bg-secondary">
        <motion.div
          animate={{ width: `${((idx + (picked ? 1 : 0)) / questions.length) * 100}%` }}
          className="h-full bg-lime"
        />
      </div>
      <div className="flex flex-1 items-center justify-center overflow-y-auto p-4 md:p-8">
        <div className="mx-auto w-full max-w-2xl">
          <h2 className="mb-6 text-center font-display text-xl font-medium leading-snug md:text-2xl">
            {q.question_text}
          </h2>
          <div className="space-y-2">
            {LETTERS.map((L) => {
              const text = q[`option_${L.toLowerCase()}` as keyof Q] as string;
              const isCorrect = L === q.correct_answer;
              const isPicked = picked === L;
              const showAsCorrect = picked && isCorrect;
              const showAsWrong = isPicked && !isCorrect;
              return (
                <motion.button
                  key={L}
                  onClick={() => choose(L)}
                  disabled={!!picked}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition",
                    !picked && "hover:bg-secondary/40 border-border bg-card",
                    showAsCorrect && "border-lime bg-lime/15",
                    showAsWrong && "border-red-500 bg-red-500/15",
                    picked && !isCorrect && !isPicked && "border-border bg-card opacity-50",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                      showAsCorrect
                        ? "bg-lime text-lime-foreground"
                        : showAsWrong
                          ? "bg-red-500 text-white"
                          : "bg-secondary",
                    )}
                  >
                    {L}
                  </span>
                  <span className="flex-1 text-sm leading-relaxed">{text}</span>
                  {showAsCorrect && <CheckCircle2 className="size-5 text-lime" />}
                  {showAsWrong && <XCircle className="size-5 text-red-500" />}
                </motion.button>
              );
            })}
          </div>
          <AnimatePresence>
            {picked && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 rounded-2xl border border-border bg-secondary/50 p-4 text-sm"
              >
                <div className="mb-1 font-semibold">
                  {ok ? "✅ Correto!" : "❌ Não foi dessa vez"}
                </div>
                <p className="text-muted-foreground">{q.explanation}</p>
                <button
                  onClick={nextQ}
                  className="press mt-3 rounded-xl bg-lime px-5 py-2 font-bold text-lime-foreground"
                >
                  {idx + 1 >= questions.length ? "Finalizar" : "Próxima"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}
