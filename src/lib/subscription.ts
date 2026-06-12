export type SubscriptionPlanId = "mensal" | "semestral" | "anual";

export type SubscriptionPlan = {
  id: SubscriptionPlanId;
  name: string;
  price: string;
  priceValue: number;
  cadence: string;
  days: number;
  summary: string;
  benefits: string[];
  highlight?: string;
};

export type Subscription = {
  planId: SubscriptionPlanId;
  startedAt: string;
  expiresAt: string;
};

import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "vestapp-subscription";

const PLAN_IDS: SubscriptionPlanId[] = ["mensal", "semestral", "anual"];

function isValidPlanId(value: unknown): value is SubscriptionPlanId {
  return typeof value === "string" && PLAN_IDS.includes(value as SubscriptionPlanId);
}

export const PLANS: SubscriptionPlan[] = [
  {
    id: "mensal",
    name: "Premium Mensal",
    price: "R$ 19,90",
    priceValue: 19.9,
    cadence: "por mes",
    days: 30,
    summary: "Boa opcao para testar todos os recursos premium.",
    benefits: [
      "Acesso a todos os flashcards com revisao espacada",
      "Simulados completos com estatisticas basicas",
      "Biblioteca de repertorio para redacao",
    ],
  },
  {
    id: "semestral",
    name: "Premium Semestral",
    price: "R$ 99,90",
    priceValue: 99.9,
    cadence: "6 meses",
    days: 180,
    summary: "Melhor equilibrio para a reta de preparacao.",
    benefits: [
      "Grupos de estudo e materiais compartilhados",
      "Simulados completos com estatisticas avancadas",
      "Calendario de estudos e progresso",
      "Biblioteca de repertorio para redacao",
    ],
    highlight: "Sugerido",
  },
  {
    id: "anual",
    name: "Premium Anual",
    price: "R$ 179,90",
    priceValue: 179.9,
    cadence: "12 meses",
    days: 365,
    summary: "Mais economia para estudar o ciclo inteiro.",
    benefits: [
      "Acesso prioritario a recursos novos liberados primeiro",
      "Grupos de estudo e materiais compartilhados",
      "Simulados completos com estatisticas avancadas",
      "Calendario de estudos e progresso",
      "Biblioteca de repertorio para redacao",
    ],
    highlight: "Maior economia",
  },
];

export function getPlanById(id: string | undefined): SubscriptionPlan | undefined {
  return PLANS.find((plan) => plan.id === id);
}

function parseSubscription(value: unknown): Subscription | null {
  if (typeof value !== "object" || value === null) return null;

  const subscription = value as Record<string, unknown>;
  if (!isValidPlanId(subscription.planId)) return null;
  if (typeof subscription.startedAt !== "string" || typeof subscription.expiresAt !== "string") {
    return null;
  }

  const startedAt = new Date(subscription.startedAt);
  const expiresAt = new Date(subscription.expiresAt);
  if (Number.isNaN(startedAt.getTime()) || Number.isNaN(expiresAt.getTime())) return null;

  return {
    planId: subscription.planId,
    startedAt: subscription.startedAt,
    expiresAt: subscription.expiresAt,
  };
}

export function getStoredSubscription(): Subscription | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return parseSubscription(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function setStoredSubscription(subscription: Subscription) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(subscription));
}

export function clearStoredSubscription() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

type UserSubscriptionRow = {
  id: string;
  user_id: string;
  plan_id: SubscriptionPlanId;
  status: "active" | "expired" | "canceled";
  started_at: string;
  expires_at: string;
  renewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function loadUserSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("plan_id,started_at,expires_at,status")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Erro ao carregar assinatura do Supabase:", error);
    return null;
  }

  if (!data) return null;
  const row = data as Partial<UserSubscriptionRow>;
  if (
    !isValidPlanId(row.plan_id) ||
    typeof row.started_at !== "string" ||
    typeof row.expires_at !== "string"
  ) {
    return null;
  }

  return {
    planId: row.plan_id,
    startedAt: row.started_at,
    expiresAt: row.expires_at,
  };
}

export function isSubscriptionActive(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  return new Date(subscription.expiresAt).getTime() > Date.now();
}

export function hasGroupAccess(subscription: Subscription | null): boolean {
  if (!subscription || !isSubscriptionActive(subscription)) return false;
  return subscription.planId === "semestral" || subscription.planId === "anual";
}

export function createSubscription(
  planId: SubscriptionPlanId,
  startDate = new Date(),
): Subscription {
  const plan = getPlanById(planId);
  if (!plan) {
    throw new Error(`Plano desconhecido: ${planId}`);
  }

  const expiresAt = new Date(startDate);
  expiresAt.setDate(expiresAt.getDate() + plan.days);

  return {
    planId,
    startedAt: startDate.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}
