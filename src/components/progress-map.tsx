import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ChevronDown, ChevronRight, Sparkles, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { TOPICS, SUBJECT_EMOJI } from "@/lib/topics";
import { cn } from "@/lib/utils";

type Progress = { subject: string; topic_key: string; completed: boolean };

export function ProgressMap() {
  const { user, profile } = useAuth();
  const [progress, setProgress] = useState<Progress[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("topic_progress")
        .select("subject, topic_key, completed")
        .eq("user_id", user.id);
      setProgress((data as Progress[]) || []);
    })();
  }, [user]);

  function isDone(subject: string, key: string) {
    return progress.some((p) => p.subject === subject && p.topic_key === key && p.completed);
  }
  function subjectPct(subject: string) {
    const topics = TOPICS[subject] || [];
    if (!topics.length) return 0;
    const done = topics.filter((t) => isDone(subject, t)).length;
    return Math.round((done / topics.length) * 100);
  }

  const allSubjects = Object.keys(TOPICS);
  const overall = Math.round(
    allSubjects.reduce((a, s) => a + subjectPct(s), 0) / allSubjects.length,
  );
  const sorted = [...allSubjects].sort((a, b) => subjectPct(b) - subjectPct(a));
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  async function toggle(subject: string, key: string) {
    if (!user) return;
    const done = isDone(subject, key);
    const newVal = !done;
    if (done) {
      await supabase
        .from("topic_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("subject", subject)
        .eq("topic_key", key);
    } else {
      await supabase.from("topic_progress").upsert(
        {
          user_id: user.id,
          subject,
          topic_key: key,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,subject,topic_key" },
      );
    }
    setProgress((p) => {
      const filtered = p.filter((x) => !(x.subject === subject && x.topic_key === key));
      return newVal ? [...filtered, { subject, topic_key: key, completed: true }] : filtered;
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-lime/30 bg-gradient-to-br from-lime/10 via-card to-card p-6">
        <div className="flex flex-wrap items-center gap-6">
          <Ring value={overall} />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-lime">
              Prontidão
            </div>
            <h2 className="mt-1 font-display text-2xl font-semibold">
              Você está {overall}% pronto para o {profile?.vestibular || "ENEM"}
            </h2>
            <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
              <div className="rounded-xl bg-lime/10 px-3 py-2">
                💪 Mais forte:{" "}
                <strong>
                  {SUBJECT_EMOJI[strongest]} {strongest}
                </strong>{" "}
                ({subjectPct(strongest)}%)
              </div>
              <div className="rounded-xl bg-red-500/10 px-3 py-2">
                🎯 Foco hoje:{" "}
                <strong>
                  {SUBJECT_EMOJI[weakest]} {weakest}
                </strong>{" "}
                ({subjectPct(weakest)}%)
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {allSubjects.map((subject) => {
          const pct = subjectPct(subject);
          const isOpen = open === subject;
          const status = pct >= 80 ? "Dominado" : pct >= 30 ? "Em andamento" : "Não iniciado";
          const statusColor =
            pct >= 80
              ? "bg-lime/15 text-lime"
              : pct >= 30
                ? "bg-amber-500/15 text-amber-500"
                : "bg-secondary text-muted-foreground";
          return (
            <motion.div
              key={subject}
              layout
              className="rounded-2xl border border-border bg-card p-4"
            >
              <button
                onClick={() => setOpen(isOpen ? null : subject)}
                className="press flex w-full items-center gap-3 text-left"
              >
                <RingSmall value={pct} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-semibold">
                    {SUBJECT_EMOJI[subject]} {subject}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs">
                    <span className={cn("rounded-full px-2 py-0.5 font-semibold", statusColor)}>
                      {status}
                    </span>
                    <span className="text-muted-foreground tabular-nums">{pct}%</span>
                  </div>
                </div>
                {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>
              {isOpen && (
                <motion.ul
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 space-y-1.5 border-t border-border pt-3"
                >
                  {(TOPICS[subject] || []).map((t) => {
                    const done = isDone(subject, t);
                    return (
                      <li key={t}>
                        <label className="press flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary/40">
                          <input
                            type="checkbox"
                            checked={done}
                            onChange={() => toggle(subject, t)}
                            className="size-4 accent-lime"
                          />
                          <span className={cn(done && "text-muted-foreground line-through")}>
                            {t}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </motion.ul>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function ProgressDashboardWidget() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Progress[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("topic_progress")
        .select("subject, topic_key, completed")
        .eq("user_id", user.id);
      setProgress((data as Progress[]) || []);
    })();
  }, [user]);

  const subjects = Object.keys(TOPICS);
  const pcts = subjects.map((s) => {
    const tot = TOPICS[s].length;
    const done = progress.filter((p) => p.subject === s && p.completed).length;
    return { s, pct: Math.round((done / tot) * 100) };
  });
  const overall = Math.round(pcts.reduce((a, b) => a + b.pct, 0) / pcts.length);
  const top3 = [...pcts].sort((a, b) => b.pct - a.pct).slice(0, 3);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-lime" />
          <h3 className="font-display text-base font-semibold">Mapa de progresso</h3>
        </div>
        <a href="/perfil" className="text-xs font-semibold text-lime hover:underline">
          Ver completo →
        </a>
      </div>
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Prontidão geral</span>
        <span className="font-bold tabular-nums">{overall}%</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-secondary">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${overall}%` }}
          className="h-full bg-lime"
        />
      </div>
      <div className="space-y-1.5">
        {top3.map((t) => (
          <div key={t.s} className="flex items-center justify-between text-xs">
            <span>
              {SUBJECT_EMOJI[t.s]} {t.s}
            </span>
            <span className="tabular-nums text-muted-foreground">{t.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Ring({ value }: { value: number }) {
  const r = 42,
    c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="relative size-28">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#B8FF4F"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: off }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-display text-2xl font-bold tabular-nums">
        {value}%
      </div>
    </div>
  );
}
function RingSmall({ value }: { value: number }) {
  const r = 18,
    c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="relative size-12 shrink-0">
      <svg viewBox="0 0 48 48" className="size-full -rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="5" />
        <motion.circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke="#B8FF4F"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: off }}
          transition={{ duration: 0.8 }}
        />
      </svg>
    </div>
  );
}
