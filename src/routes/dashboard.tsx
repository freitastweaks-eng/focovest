import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  BookOpen,
  Timer,
  Library,
  PenLine,
  Flame,
  Clock,
  Target,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useAppStore, computeStreak } from "@/store/app-store";
import { useAuth } from "@/lib/auth-context";
import { CONTENTS, MOTIVATIONAL_PHRASES, DAILY_TIPS } from "@/lib/data";
import { PageContainer, PageHeader } from "@/components/page";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const { profile } = useAuth();
  const { sessions, drafts, completedContent, streakDays } = useAppStore();
  const streak = computeStreak(streakDays);

  const name = profile?.display_name?.split(" ")[0] || "estudante";
  const dayIndex = Math.floor(Date.now() / 86400000);
  const phrase = MOTIVATIONAL_PHRASES[dayIndex % MOTIVATIONAL_PHRASES.length];
  const tip = DAILY_TIPS[dayIndex % DAILY_TIPS.length];

  const weekStart = Date.now() - 7 * 86400000;
  const weeklyMinutes = sessions
    .filter((s) => s.timestamp >= weekStart)
    .reduce((a, s) => a + s.duration, 0);
  const weeklyHours = (weeklyMinutes / 60).toFixed(1);

  const lastContent = CONTENTS[0];

  const stats = [
    { label: "Horas esta semana", value: weeklyHours, icon: Clock },
    { label: "Redações escritas", value: drafts.length, icon: PenLine },
    { label: "Sessões concluídas", value: sessions.length, icon: Timer },
    { label: "Streak de dias", value: streak, icon: Flame },
  ];

  const goals = [
    {
      label: profile?.vestibular || "ENEM",
      progress: Math.min(100, completedContent.length * 8 + 12),
    },
    { label: "FUVEST", progress: Math.min(100, completedContent.length * 6 + 8) },
    { label: "UNICAMP", progress: Math.min(100, completedContent.length * 5 + 5) },
  ];

  const quick = [
    { to: "/conteudos", label: "Conteúdos", icon: BookOpen },
    { to: "/timer", label: "Timer", icon: Timer },
    { to: "/biblioteca", label: "Biblioteca", icon: Library },
    { to: "/redacoes", label: "Redações", icon: PenLine },
  ];

  return (
    <PageContainer>
      <PageHeader eyebrow="Dashboard" title={`Olá, ${name}.`} description={phrase} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="lift glass relative overflow-hidden rounded-2xl p-5"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
              <s.icon className="size-4 text-lime" />
            </div>
            <div className="mt-3 font-display text-3xl font-semibold tabular-nums">{s.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quick.map((q) => (
          <Link
            key={q.to}
            to={q.to}
            className="press lift group flex items-center justify-between rounded-2xl border border-border bg-card p-4 text-sm font-medium"
          >
            <span className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-lg bg-secondary">
                <q.icon className="size-4" />
              </span>
              {q.label}
            </span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Continue estudando
          </div>
          <h3 className="font-display text-xl font-semibold">{lastContent.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{lastContent.excerpt}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Tag>{lastContent.subject}</Tag>
            <Tag>{lastContent.vestibular}</Tag>
            <Tag>{lastContent.readingTime} min</Tag>
            <Link
              to="/conteudos/$id"
              params={{ id: lastContent.id }}
              className="press ml-auto inline-flex items-center gap-1.5 rounded-full bg-lime px-4 py-1.5 text-sm font-semibold text-lime-foreground"
            >
              Continuar <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Sparkles className="size-3.5 text-lime" /> Dica do dia
          </div>
          <p className="text-sm leading-relaxed">{tip}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Target className="size-4 text-lime" />
          <h3 className="font-display text-lg font-semibold">Progresso por vestibular</h3>
        </div>
        <div className="space-y-4">
          {goals.map((g) => (
            <div key={g.label}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium">{g.label}</span>
                <span className="tabular-nums text-muted-foreground">{g.progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${g.progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full bg-lime"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-secondary/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      {children}
    </span>
  );
}
