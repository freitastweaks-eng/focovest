import { Moon, Sun, Flame, Menu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore, computeStreak } from "@/store/app-store";
import { useAuth } from "@/lib/auth-context";

export function TopBar({ onMenu }: { onMenu?: () => void }) {
  const { theme, toggleTheme, streakDays } = useAppStore();
  const { profile } = useAuth();
  const streak = computeStreak(streakDays);
  const name = profile?.display_name?.split(" ")[0] || "estudante";

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl md:px-8">
      <button
        onClick={onMenu}
        className="press flex size-9 items-center justify-center rounded-xl border border-border bg-card md:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="size-4" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-base font-semibold sm:text-lg">
          {greeting}, {name} <span className="text-lime">✦</span>
        </div>
        <div className="mt-0.5 truncate text-xs capitalize text-muted-foreground">{today}</div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
          <Flame className="size-4 text-lime" strokeWidth={2.4} />
          <span className="text-sm font-semibold tabular-nums">{streak}</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">dias</span>
        </div>

        <button
          onClick={toggleTheme}
          className="press relative flex size-9 items-center justify-center overflow-hidden rounded-xl border border-border bg-card"
          aria-label="Alternar tema"
        >
          <AnimatePresence mode="wait" initial={false}>
            {theme === "dark" ? (
              <motion.div
                key="sun"
                initial={{ rotate: -60, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 60, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Sun className="size-4 text-lime" strokeWidth={2.4} />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: 60, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -60, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Moon className="size-4" strokeWidth={2.4} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </header>
  );
}
