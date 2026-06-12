import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { BookOpen, Timer, PenLine, Sparkles, ArrowRight, Check } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VestApp — Sua aprovação começa aqui" },
      {
        name: "description",
        content:
          "Plataforma premium de estudos para ENEM, FUVEST, UNICAMP e mais. Conteúdos completos, timer Pomodoro, redações nota 1000 e repertório curado.",
      },
      { property: "og:title", content: "VestApp — Sua aprovação começa aqui" },
      {
        property: "og:description",
        content: "Conteúdos completos, timer Pomodoro e redações nota 1000 em um só lugar.",
      },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  {
    icon: BookOpen,
    title: "Conteúdos completos",
    desc: "Todas as matérias, todos os vestibulares — com exercícios e gabarito.",
  },
  {
    icon: Timer,
    title: "Timer Pomodoro",
    desc: "Sessões cronometradas que mantêm o foco em ritmo de aprovação.",
  },
  {
    icon: PenLine,
    title: "Redações nota 1000",
    desc: "Modelos comentados, temas recorrentes e editor com repertório.",
  },
];

function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background dark">
      {/* gradient mesh */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 size-[480px] rounded-full bg-lime/20 blur-[140px]" />
        <div className="absolute right-[-10%] top-1/3 size-[520px] rounded-full bg-indigo-500/20 blur-[160px]" />
        <div className="absolute bottom-[-20%] left-1/3 size-[600px] rounded-full bg-fuchsia-500/10 blur-[180px]" />
      </div>

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-lime text-lime-foreground accent-glow">
            <Sparkles className="size-4" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-semibold">VestApp</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="press hidden rounded-full px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground sm:inline-block"
          >
            Entrar
          </Link>
          <Link
            to="/cadastro"
            className="press rounded-full bg-lime px-4 py-2 text-sm font-semibold text-lime-foreground"
          >
            Começar grátis
          </Link>
        </div>
      </nav>

      <main className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-8 lg:grid-cols-[60%_40%] lg:gap-8 lg:pt-16">
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-lime"
          >
            <Sparkles className="size-3" /> Plataforma #1 para vestibulandos
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Sua aprovação
            <br />
            <span className="bg-gradient-to-r from-lime via-lime to-lime/60 bg-clip-text text-transparent">
              começa aqui.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground"
          >
            Conteúdos completos, exercícios comentados, timer Pomodoro e redações nota 1000 — tudo
            em uma só plataforma feita para quem vai passar.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              to="/cadastro"
              className="press inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3.5 font-display text-base font-semibold text-lime-foreground accent-glow"
            >
              Começar agora — é grátis <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/login"
              className="press inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-5 py-3.5 text-sm font-medium text-foreground backdrop-blur-md hover:bg-card"
            >
              Já tenho conta → Entrar
            </Link>
          </motion.div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.08 }}
                className="glass rounded-2xl p-4"
              >
                <f.icon className="mb-2 size-5 text-lime" />
                <div className="font-display text-sm font-semibold">{f.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Floating preview cards */}
        <section className="relative hidden lg:block">
          <div className="relative h-[560px] w-full">
            <FloatCard
              delay={0.2}
              className="absolute right-0 top-4 w-72 -rotate-3"
              title="Timer ativo"
              subtitle="Matemática"
            >
              <div className="font-display text-4xl font-semibold tabular-nums">24:31</div>
              <div className="mt-3 h-1.5 rounded-full bg-secondary">
                <div className="h-full w-3/4 rounded-full bg-lime" />
              </div>
            </FloatCard>

            <FloatCard
              delay={0.4}
              className="absolute left-0 top-44 w-80 rotate-2"
              title="Conteúdo do dia"
              subtitle="Funções do 2º grau"
            >
              <p className="text-xs text-muted-foreground line-clamp-3">
                Domine parábolas, vértice e Bhaskara com 8 exercícios estilo ENEM com gabarito
                comentado.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full bg-lime/15 px-2 py-0.5 text-[10px] font-bold text-lime">
                  ENEM
                </span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  12 min
                </span>
              </div>
            </FloatCard>

            <FloatCard
              delay={0.6}
              className="absolute bottom-12 right-8 w-72 -rotate-1"
              title="Redação nota 1000"
              subtitle="ENEM 2023"
            >
              <ul className="space-y-1.5 text-xs">
                {[
                  "Competência 1: domínio da norma",
                  "Competência 3: argumentação",
                  "Competência 5: proposta de intervenção",
                ].map((c) => (
                  <li key={c} className="flex items-start gap-1.5 text-muted-foreground">
                    <Check className="mt-0.5 size-3 shrink-0 text-lime" />
                    {c}
                  </li>
                ))}
              </ul>
            </FloatCard>
          </div>
        </section>
      </main>
    </div>
  );
}

function FloatCard({
  className,
  title,
  subtitle,
  children,
  delay = 0,
}: {
  className?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`glass rounded-2xl p-5 shadow-2xl ${className}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </div>
          <div className="mt-0.5 font-display text-sm font-semibold">{subtitle}</div>
        </div>
        <div className="size-2 animate-pulse rounded-full bg-lime" />
      </div>
      {children}
    </motion.div>
  );
}
