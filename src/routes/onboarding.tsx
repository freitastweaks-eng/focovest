import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { VESTIBULARES } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({ component: OnboardingPage });

const STYLES = [
  { id: "pomodoro", label: "Pomodoro 25min", emoji: "🍅", desc: "Foco curto e intenso" },
  { id: "longa", label: "Sessão longa 50min", emoji: "📖", desc: "Imersão profunda" },
  { id: "rapida", label: "Revisão rápida 15min", emoji: "⚡", desc: "Revisões focadas" },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [vestibular, setVestibular] = useState<string>("ENEM");
  const [target, setTarget] = useState(850);
  const [styles, setStyles] = useState<string[]>(["pomodoro"]);
  const [saving, setSaving] = useState(false);
  const [confetti, setConfetti] = useState(false);

  const finish = async () => {
    setSaving(true);
    try {
      await updateProfile({
        vestibular,
        target_score: target,
        study_styles: styles,
        onboarded: true,
      });
      setConfetti(true);
      setTimeout(() => {
        toast.success("Tudo pronto! Bons estudos 🚀");
        navigate({ to: "/dashboard", replace: true });
      }, 1400);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : error && typeof error === "object" && "message" in error
            ? String((error as { message?: unknown }).message)
            : "Erro ao salvar onboarding";
      toast.error(message);
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="dark relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 size-[480px] rounded-full bg-lime/15 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10">
        <div className="mb-2 flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-lime text-lime-foreground accent-glow">
            <Sparkles className="size-4" />
          </div>
          <span className="font-display text-lg font-semibold">VestApp</span>
        </div>

        <div className="mt-8 mb-6">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Passo {step} de 3</span>
            <span>{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <motion.div
              initial={false}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ type: "spring", stiffness: 240, damping: 28 }}
              className="h-full rounded-full bg-lime"
            />
          </div>
        </div>

        <div className="glass flex-1 rounded-3xl p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="font-display text-3xl font-semibold">Qual seu vestibular?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Vamos personalizar o conteúdo para você.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[...VESTIBULARES, "Outro"].map((v) => (
                    <button
                      key={v}
                      onClick={() => setVestibular(v)}
                      className={cn(
                        "press rounded-2xl border p-4 text-left transition-all",
                        vestibular === v
                          ? "border-lime bg-lime/10"
                          : "border-border bg-card hover:border-lime/50",
                      )}
                    >
                      <div className="font-display text-base font-semibold">{v}</div>
                      {vestibular === v && <Check className="mt-1.5 size-4 text-lime" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="font-display text-3xl font-semibold">Qual sua meta?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sua nota desejada nos motiva todos os dias.
                </p>
                <div className="mt-8 text-center">
                  <div className="font-display text-7xl font-semibold tabular-nums">{target}</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    pontos
                  </div>
                </div>
                <input
                  type="range"
                  min={500}
                  max={1000}
                  step={10}
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value))}
                  className="mt-6 w-full accent-lime"
                />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>500</span>
                  <span>1000</span>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="font-display text-3xl font-semibold">Estilo de estudo</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Selecione um ou mais (pode mudar depois).
                </p>
                <div className="mt-6 space-y-3">
                  {STYLES.map((s) => {
                    const active = styles.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() =>
                          setStyles((prev) =>
                            active ? prev.filter((x) => x !== s.id) : [...prev, s.id],
                          )
                        }
                        className={cn(
                          "press flex w-full items-center gap-4 rounded-2xl border p-4 text-left",
                          active
                            ? "border-lime bg-lime/10"
                            : "border-border bg-card hover:border-lime/50",
                        )}
                      >
                        <span className="text-3xl">{s.emoji}</span>
                        <div className="flex-1">
                          <div className="font-display font-semibold">{s.label}</div>
                          <div className="text-xs text-muted-foreground">{s.desc}</div>
                        </div>
                        {active && <Check className="size-5 text-lime" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="press text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            Voltar
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="press inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3 font-display font-semibold text-lime-foreground"
            >
              Continuar <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={saving || styles.length === 0}
              className="press inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3 font-display font-semibold text-lime-foreground disabled:opacity-60"
            >
              {saving ? "Salvando…" : "Vamos começar!"} <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {confetti && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          >
            {Array.from({ length: 40 }).map((_, i) => {
              const angle = (i / 40) * Math.PI * 2;
              const dist = 200 + Math.random() * 200;
              return (
                <motion.div
                  key={i}
                  className="absolute size-2 rounded-sm"
                  style={{
                    background: ["#B8FF4F", "#fff", "#7dd3fc", "#f9a8d4"][i % 4],
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                  animate={{
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist,
                    opacity: 0,
                    rotate: 360,
                  }}
                  transition={{ duration: 1.4, ease: "easeOut" }}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
