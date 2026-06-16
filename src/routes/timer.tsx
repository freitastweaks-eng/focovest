import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/page";
import { useAppStore } from "@/store/app-store";
import { SUBJECTS } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/timer")({ component: TimerPage });

type Mode = { id: string; label: string; minutes: number; emoji: string };

const PRESETS: Mode[] = [
  { id: "pomodoro", label: "Pomodoro", minutes: 25, emoji: "🍅" },
  { id: "longa", label: "Sessão Longa", minutes: 50, emoji: "📖" },
  { id: "rapida", label: "Revisão Rápida", minutes: 15, emoji: "⚡" },
];

const MOTIVATIONAL = [
  "Foco. Você está construindo seu futuro.",
  "Cada minuto agora é uma vaga depois.",
  "Disciplina é liberdade.",
  "Respira. Continua. Conquista.",
  "Você é mais forte do que sua vontade de parar.",
];

const TICK_RATE = 1000 / 60;

function TimerPage() {
  const { sessions, addSession, soundsEnabled, pomodoroDurations } = useAppStore();

  const [mode, setMode] = useState<Mode>(PRESETS[0]);
  const [customMinutes, setCustomMinutes] = useState(30);
  const [isCustom, setIsCustom] = useState(false);
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);

  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<"focus" | "break">("focus");
  const totalMs = (() => {
    if (phase === "break")
      return (
        (mode.id === "longa" ? pomodoroDurations.longBreak : pomodoroDurations.shortBreak) *
        60 *
        1000
      );
    if (isCustom) return customMinutes * 60 * 1000;
    return mode.minutes * 60 * 1000;
  })();

  const [remaining, setRemaining] = useState(totalMs);
  const [motivIdx, setMotivIdx] = useState(0);
  const [burst, setBurst] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const baseRemainingRef = useRef<number>(totalMs);
  const previousTotalMsRef = useRef<number>(totalMs);
  const rafRef = useRef<number | null>(null);

  // Reset on mode/phase/custom duration change while not running. Pausing keeps the current time.
  useEffect(() => {
    if (previousTotalMsRef.current === totalMs) return;
    previousTotalMsRef.current = totalMs;
    if (!running) {
      setRemaining(totalMs);
      baseRemainingRef.current = totalMs;
    }
  }, [running, totalMs]);

  // motivational rotation every 5 minutes
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setMotivIdx((i) => (i + 1) % MOTIVATIONAL.length), 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [running]);

  const reset = useCallback(() => {
    setRunning(false);
    baseRemainingRef.current = totalMs;
    setRemaining(totalMs);
  }, [totalMs]);

  const playBell = useCallback(() => {
    if (!soundsEnabled) return;
    try {
      const AudioContextClass =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(880, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);
      o.start();
      o.stop(ctx.currentTime + 1.5);
    } catch {
      // Sound is optional; browsers may block AudioContext without user interaction.
    }
  }, [soundsEnabled]);

  const finishPhase = useCallback(() => {
    setRunning(false);
    setRemaining(0);
    playBell();
    setBurst((b) => b + 1);

    if (phase === "focus") {
      const minutes = Math.round(totalMs / 60000);
      addSession({
        id: crypto.randomUUID(),
        subject,
        duration: minutes,
        timestamp: Date.now(),
      });
      toast.success(`Sessão concluída! +${minutes} min de ${subject} 🎉`);
      // auto-switch to break
      setTimeout(() => {
        setPhase("break");
      }, 600);
    } else {
      toast("Pausa concluída. Bora voltar! 💪");
      setTimeout(() => setPhase("focus"), 600);
    }
  }, [phase, totalMs, subject, addSession, playBell]);

  // RAF loop
  useEffect(() => {
    if (!running) return;
    startTimeRef.current = performance.now();

    const tick = () => {
      if (startTimeRef.current === null) return;
      const elapsed = performance.now() - startTimeRef.current;
      const r = Math.max(0, baseRemainingRef.current - elapsed);
      setRemaining(r);
      if (r <= 0) {
        finishPhase();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // store remaining when pausing
      if (startTimeRef.current !== null) {
        const elapsed = performance.now() - startTimeRef.current;
        baseRemainingRef.current = Math.max(0, baseRemainingRef.current - elapsed);
        startTimeRef.current = null;
      }
    };
  }, [running, finishPhase]);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.code === "Space") {
        e.preventDefault();
        setRunning((r) => !r);
      } else if (e.key.toLowerCase() === "r") {
        reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reset]);

  const skip = () => finishPhase();

  // ring math
  const progress = totalMs > 0 ? remaining / totalMs : 0; // 1 -> 0
  const SIZE = 320;
  const STROKE = 14;
  const R = (SIZE - STROKE) / 2;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - progress);

  const ringColor = (() => {
    if (phase === "break") return "var(--lime)";
    if (progress > 0.4) return "var(--lime)";
    if (progress > 0.2) return "var(--warn)";
    return "var(--danger)";
  })();

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  // sessions today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysSessions = sessions.filter((s) => s.timestamp >= today.getTime());
  const todayMinutes = todaysSessions.reduce((a, s) => a + s.duration, 0);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Timer"
        title={phase === "focus" ? "Hora de focar" : "Hora da pausa"}
        description={running ? MOTIVATIONAL[motivIdx] : "Escolha um modo e clique em começar."}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-10">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setIsCustom(false);
                  setMode(p);
                  setPhase("focus");
                }}
                className={cn(
                  "press inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium",
                  !isCustom && mode.id === p.id
                    ? "border-lime bg-lime text-lime-foreground"
                    : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
                )}
              >
                <span>{p.emoji}</span>
                {p.label}
                <span className="opacity-60">{p.minutes}m</span>
              </button>
            ))}
            <button
              onClick={() => {
                setIsCustom(true);
                setPhase("focus");
              }}
              className={cn(
                "press inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium",
                isCustom
                  ? "border-lime bg-lime text-lime-foreground"
                  : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
              )}
            >
              ✏️ Custom
            </button>
          </div>

          {isCustom && (
            <div className="mb-6 rounded-xl border border-border bg-secondary/40 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Duração personalizada</span>
                <span className="font-display text-2xl tabular-nums">{customMinutes} min</span>
              </div>
              <input
                type="range"
                min={5}
                max={120}
                step={5}
                value={customMinutes}
                onChange={(e) => setCustomMinutes(Number(e.target.value))}
                className="w-full accent-lime"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Estudando
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium outline-none focus:border-lime"
            >
              {SUBJECTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="relative mt-6 flex flex-col items-center">
            <div className="relative" style={{ width: SIZE, height: SIZE }}>
              <svg
                width={SIZE}
                height={SIZE}
                className={cn("rotate-[-90deg]", running && "animate-pulse-glow")}
              >
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={R}
                  stroke="var(--secondary)"
                  strokeWidth={STROKE}
                  fill="none"
                />
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={R}
                  stroke={ringColor}
                  strokeWidth={STROKE}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={offset}
                  style={{ transition: "stroke 600ms ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {phase === "focus" ? mode.label : "Pausa"}
                </div>
                <div className="font-display text-[64px] font-semibold leading-none tabular-nums sm:text-[80px]">
                  {display}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{subject}</div>
              </div>

              <AnimatePresence>
                {burst > 0 && (
                  <motion.div
                    key={burst}
                    initial={{ opacity: 1, scale: 0.6 }}
                    animate={{ opacity: 0, scale: 1.6 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="pointer-events-none absolute inset-0"
                    onAnimationComplete={() => {}}
                  >
                    {Array.from({ length: 18 }).map((_, i) => {
                      const angle = (i / 18) * Math.PI * 2;
                      return (
                        <motion.div
                          key={i}
                          className="absolute left-1/2 top-1/2 size-2 rounded-full bg-lime"
                          initial={{ x: 0, y: 0, opacity: 1 }}
                          animate={{
                            x: Math.cos(angle) * 160,
                            y: Math.sin(angle) * 160,
                            opacity: 0,
                          }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-8 flex items-center gap-2">
              <CtrlButton onClick={reset} aria-label="Reset">
                <RotateCcw className="size-5" />
              </CtrlButton>
              <button
                onClick={() => setRunning((r) => !r)}
                className="press inline-flex h-14 w-44 items-center justify-center gap-2 rounded-full bg-lime font-display text-lg font-semibold text-lime-foreground accent-glow"
              >
                {running ? <Pause className="size-5" /> : <Play className="size-5" />}
                {running ? "Pausar" : "Começar"}
              </button>
              <CtrlButton onClick={skip} aria-label="Skip">
                <SkipForward className="size-5" />
              </CtrlButton>
            </div>

            <div className="mt-4 text-xs text-muted-foreground">
              <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5">Espaço</kbd>{" "}
              iniciar/pausar ·{" "}
              <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5">R</kbd> reset
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-4 text-center">
            <Stat label="Sessões hoje" value={todaysSessions.length} />
            <Stat label="Minutos" value={todayMinutes} />
            <Stat label="Total" value={sessions.length} />
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-3 font-display text-lg font-semibold">Histórico de hoje</h3>
            {todaysSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma sessão ainda. Comece quando estiver pronto.
              </p>
            ) : (
              <ul className="space-y-2">
                {todaysSessions.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{s.subject}</span>
                    <span className="text-muted-foreground">
                      {s.duration} min ·{" "}
                      {new Date(s.timestamp).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}

function CtrlButton({ children, onClick, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      {...rest}
      className="press flex size-12 items-center justify-center rounded-full border border-border bg-secondary/60 text-foreground hover:bg-secondary"
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="font-display text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
