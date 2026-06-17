import { Link } from "@tanstack/react-router";
import { Crown, Lock, Sparkles } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  isSubscriptionActive,
  type Subscription,
  type SubscriptionPlanId,
} from "@/lib/subscription";

export type BenefitKey = "contents" | "flashcards" | "simulados" | "groups" | "calendar";

type BenefitRule = {
  title: string;
  description: string;
  dailyLimit: number;
  unlimitedPlans?: SubscriptionPlanId[];
};

export const BENEFIT_RULES: Record<BenefitKey, BenefitRule> = {
  contents: {
    title: "Biblioteca de conteudos",
    description: "Leia conteudos por materia e vestibular.",
    dailyLimit: 3,
    unlimitedPlans: ["mensal", "semestral", "anual"],
  },
  flashcards: {
    title: "Flashcards com revisao espacada",
    description: "Estude decks prontos e memorize pontos-chave.",
    dailyLimit: 1,
    unlimitedPlans: ["mensal", "semestral", "anual"],
  },
  simulados: {
    title: "Simulados completos",
    description: "Resolva provas e acompanhe seu desempenho.",
    dailyLimit: 1,
    unlimitedPlans: ["mensal", "semestral", "anual"],
  },
  groups: {
    title: "Grupos e materiais compartilhados",
    description: "Participe de grupos, posts e materiais.",
    dailyLimit: 1,
    unlimitedPlans: ["semestral", "anual"],
  },
  calendar: {
    title: "Calendario de estudos",
    description: "Planeje tarefas, revisoes e provas.",
    dailyLimit: 2,
    unlimitedPlans: ["semestral", "anual"],
  },
};

type UsageRecord = {
  date: string;
  counts: Partial<Record<BenefitKey, number>>;
};

const STORAGE_KEY = "vestapp-daily-benefit-usage";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readUsage(): UsageRecord {
  if (typeof window === "undefined") return { date: getTodayKey(), counts: {} };

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) || "null",
    ) as UsageRecord | null;
    if (parsed?.date === getTodayKey() && parsed.counts) return parsed;
  } catch {
    // Ignore invalid local storage and start a fresh day.
  }

  return { date: getTodayKey(), counts: {} };
}

function writeUsage(usage: UsageRecord) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
}

function getUsage(key: BenefitKey) {
  return readUsage().counts[key] ?? 0;
}

function consumeUsage(key: BenefitKey) {
  const usage = readUsage();
  usage.counts[key] = (usage.counts[key] ?? 0) + 1;
  writeUsage(usage);
  return usage.counts[key] ?? 0;
}

export function useDailyBenefitAccess(key: BenefitKey, subscription: Subscription | null) {
  const rule = BENEFIT_RULES[key];
  const isPremium =
    isSubscriptionActive(subscription) &&
    (!rule.unlimitedPlans || rule.unlimitedPlans.includes(subscription!.planId));
  const [used, setUsed] = useState(() => getUsage(key));

  const remaining = Math.max(0, rule.dailyLimit - used);
  const allowed = isPremium || remaining > 0;
  const consume = useCallback(() => {
    if (isPremium) return true;
    if (getUsage(key) >= rule.dailyLimit) {
      setUsed(getUsage(key));
      return false;
    }
    setUsed(consumeUsage(key));
    return true;
  }, [isPremium, key, rule.dailyLimit]);

  return useMemo(
    () => ({
      allowed,
      isPremium,
      rule,
      used,
      remaining: isPremium ? Infinity : remaining,
      consume,
    }),
    [allowed, consume, isPremium, remaining, rule, used],
  );
}

export function DailyLimitBanner({
  benefitKey,
  subscription,
}: {
  benefitKey: BenefitKey;
  subscription: Subscription | null;
}) {
  const access = useDailyBenefitAccess(benefitKey, subscription);

  if (access.isPremium) {
    return (
      <div className="mb-4 rounded-2xl border border-lime/30 bg-lime/10 px-4 py-3 text-sm">
        <div className="flex items-center gap-2 font-semibold text-lime">
          <Crown className="size-4" /> Beneficio ilimitado pela sua assinatura
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-2xl border border-border bg-card px-4 py-3 text-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="size-4 text-lime" /> Degustacao diaria: {access.rule.title}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Restam {access.remaining} de {access.rule.dailyLimit} acessos hoje. Assinantes usam sem
            limite diario.
          </p>
        </div>
        <Link
          to="/assinatura"
          className="press inline-flex items-center justify-center gap-1.5 rounded-xl bg-lime px-4 py-2 text-xs font-bold text-lime-foreground"
        >
          <Crown className="size-3.5" /> Assinar
        </Link>
      </div>
    </div>
  );
}

export function DailyLimitBlock({ benefitKey }: { benefitKey: BenefitKey }) {
  const rule = BENEFIT_RULES[benefitKey];
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center">
      <Lock className="mx-auto mb-3 size-7 text-lime" />
      <h2 className="font-display text-xl font-semibold">Limite diario atingido</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Voce ja usou a cota gratuita de {rule.title.toLowerCase()} hoje. A assinatura libera esse
        beneficio sem limite diario.
      </p>
      <Link
        to="/assinatura"
        className="press mt-5 inline-flex items-center gap-1.5 rounded-xl bg-lime px-5 py-2.5 text-sm font-bold text-lime-foreground"
      >
        <Crown className="size-4" /> Liberar ilimitado
      </Link>
    </div>
  );
}
