import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarClock,
  Check,
  Crown,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  PLANS,
  getPlanById,
  getStoredSubscription,
  isSubscriptionActive,
  setStoredSubscription,
  clearStoredSubscription,
  type Subscription,
  type SubscriptionPlan,
  type SubscriptionPlanId,
} from "@/lib/subscription";
import { useAuth } from "@/lib/auth-context";
import { LofyPayPixCheckout } from "@/components/lofypay-pix";
import { createLofyPayPix, getLofyPayStatus } from "@/lib/lofypay-actions";

export const Route = createFileRoute("/assinatura")({ component: AssinaturaPage });

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function daysBetween(start: Date, end: Date) {
  return Math.ceil((end.getTime() - start.getTime()) / 86400000);
}

type LofyPayCheckout = {
  idTransaction: string;
  paymentCode: string;
  paymentCodeBase64: string;
  externalReference: string;
  status: string;
};

function isPlanId(value: unknown): value is SubscriptionPlanId {
  return typeof value === "string" && PLANS.some((plan) => plan.id === value);
}

function AssinaturaPage() {
  const { user, profile, subscription: authSubscription, refreshSubscription } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>("mensal");
  const [checkout, setCheckout] = useState<LofyPayCheckout | null>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isRefreshingPayment, setIsRefreshingPayment] = useState(false);
  const [clientName, setClientName] = useState<string>(profile?.display_name ?? "");
  const [clientDocument, setClientDocument] = useState<string>("");
  const [clientEmail, setClientEmail] = useState<string>(user?.email ?? "");
  const [activationMessage, setActivationMessage] = useState<string>("");

  useEffect(() => {
    setClientName(profile?.display_name ?? "");
    setClientEmail(user?.email ?? "");
  }, [profile, user]);

  useEffect(() => {
    if (user) {
      if (authSubscription) {
        setSubscription(authSubscription);
        setSelectedPlanId(authSubscription.planId);
      } else {
        setSubscription(null);
      }
      return;
    }

    const storedSubscription = getStoredSubscription();
    if (storedSubscription) {
      setSubscription(storedSubscription);
      setSelectedPlanId(storedSubscription.planId);
    }
  }, [user, authSubscription]);

  useEffect(() => {
    if (user) return;
    if (subscription) {
      setStoredSubscription(subscription);
    } else {
      clearStoredSubscription();
    }
  }, [subscription, user]);

  const selectedPlan = PLANS.find((plan) => plan.id === selectedPlanId) ?? PLANS[0];
  const currentPlan = getPlanById(subscription?.planId ?? selectedPlanId) ?? selectedPlan;

  const isActiveSubscription = isSubscriptionActive(subscription);

  const status = useMemo(() => {
    if (!subscription || !isActiveSubscription) {
      return {
        expires: new Date(),
        totalDays: 0,
        remainingDays: 0,
        progress: 0,
        isExpired: true,
        isEndingSoon: false,
      };
    }

    const now = new Date();
    const start = new Date(subscription.startedAt);
    const expires = new Date(subscription.expiresAt);
    const totalDays = Math.max(1, daysBetween(start, expires));
    const remainingDays = Math.max(0, daysBetween(now, expires));
    const usedDays = Math.min(totalDays, Math.max(0, totalDays - remainingDays));
    const progress = Math.min(100, Math.round((usedDays / totalDays) * 100));
    return {
      expires,
      totalDays,
      remainingDays,
      progress,
      isExpired: remainingDays <= 0,
      isEndingSoon: remainingDays > 0 && remainingDays <= 7,
    };
  }, [subscription, isActiveSubscription]);

  const createPixCharge = async (plan: SubscriptionPlan) => {
    if (!user) {
      toast.error("Faça login para gerar o PIX.");
      return;
    }

    if (!clientName.trim() || !clientDocument.trim() || !clientEmail.trim()) {
      toast.error("Preencha nome, documento e email para gerar o PIX.");
      return;
    }

    setIsCreatingPayment(true);
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      if (!accessToken) {
        toast.error("Sessão inválida. Faça login novamente.");
        return;
      }

      const result = await createLofyPayPix({
        data: {
          origin: window.location.origin,
          accessToken,
          method: "pix",
          plan_id: plan.id,
          user_id: user.id,
          client: {
            name: clientName,
            document: clientDocument,
            email: clientEmail,
          },
        },
      });

      if (!result.ok) {
        toast.error(result.message || "Falha ao criar o PIX.");
        return;
      }

      const data = result.payload;
      setCheckout({
        idTransaction: data.idTransaction,
        paymentCode: data.paymentCode,
        paymentCodeBase64: data.paymentCodeBase64,
        externalReference: data.externalReference,
        status: data.statusPayment,
      });
      setActivationMessage("");
      setSelectedPlanId(plan.id);
      toast.success("PIX criado com sucesso. Complete o pagamento para ativar a assinatura.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(message || "Erro ao criar cobrança PIX.");
      console.error("Erro ao criar cobranca PIX:", error);
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const refreshPaymentStatus = async () => {
    if (!checkout || !user) {
      return;
    }

    setIsRefreshingPayment(true);
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      if (!accessToken) {
        toast.error("Sessão inválida. Faça login novamente.");
        return;
      }

      const result = await getLofyPayStatus({
        data: {
          origin: window.location.origin,
          accessToken,
          idtransaction: checkout.idTransaction,
        },
      });

      if (!result.ok) {
        toast.error(result.message || "Falha ao consultar status do PIX.");
        return;
      }

      const data = result.payload;
      setCheckout((current) => (current ? { ...current, status: data.status } : current));

      if (data.status === "PAID") {
        const paidSubscription =
          data.subscription && isPlanId(data.subscription.planId)
            ? {
                planId: data.subscription.planId,
                startedAt: data.subscription.startedAt,
                expiresAt: data.subscription.expiresAt,
              }
            : await refreshSubscription();
        const activePlan = getPlanById(paidSubscription?.planId ?? data.planId);

        if (paidSubscription) {
          setSubscription(paidSubscription);
          setSelectedPlanId(paidSubscription.planId);
        }

        await refreshSubscription();
        const message = activePlan
          ? `${activePlan.name} ativo. Beneficios liberados ate ${paidSubscription ? formatDate(paidSubscription.expiresAt) : "o fim do ciclo"}.`
          : "Pagamento confirmado. Seu plano Premium foi ativado.";
        setActivationMessage(message);
        toast.success(message);
      }
    } catch (error) {
      toast.error("Erro ao consultar status do pagamento.");
      console.error(error);
    } finally {
      setIsRefreshingPayment(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Assinatura"
        title="Seu plano Premium"
        description="Acompanhe o tempo restante, veja os beneficios ativos e renove quando estiver perto do fim."
        actions={
          <Button
            onClick={() => createPixCharge(selectedPlan)}
            className="rounded-xl bg-lime font-semibold text-lime-foreground hover:bg-lime/90"
          >
            <RefreshCw className="size-4" />
            Gerar PIX
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          <div
            className={cn(
              "rounded-2xl border bg-card p-5",
              status.isExpired
                ? "border-red-500/40"
                : status.isEndingSoon
                  ? "border-amber-400/50"
                  : "border-border",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-3 py-1 text-xs font-semibold text-lime">
                  <Crown className="size-3.5" />
                  {currentPlan.name}
                </div>
                <h2 className="mt-4 font-display text-2xl font-semibold">
                  {status.isExpired
                    ? "Sua assinatura expirou"
                    : status.isEndingSoon
                      ? "Sua assinatura esta acabando"
                      : "Assinatura ativa"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {subscription
                    ? `Valida ate ${formatDate(subscription.expiresAt)}.`
                    : "Nenhuma assinatura ativa."}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/40 px-5 py-4 text-right">
                <div className="font-display text-4xl font-semibold tabular-nums">
                  {status.remainingDays}
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  dias restantes
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Ciclo da assinatura</span>
                <span>{status.progress}% usado</span>
              </div>
              <Progress
                value={status.progress}
                aria-label="Progresso do ciclo da assinatura"
                className="h-2 bg-secondary"
              />
            </div>

            {(status.isEndingSoon || status.isExpired) && (
              <div className="mt-5 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4">
                <div className="flex items-start gap-3">
                  <CalendarClock className="mt-0.5 size-5 text-amber-300" />
                  <div>
                    <div className="font-display font-semibold">
                      {status.isExpired
                        ? subscription
                          ? "Renove para reativar o Premium"
                          : "Selecione um plano para ativar o Premium"
                        : "Renove antes de perder acesso"}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      O botao de renovacao adiciona dias ao fim atual da assinatura.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <ShieldCheck className="size-4 text-lime" />
                  Checkout PIX
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Gere o PIX e conclua o pagamento para ativar sua assinatura no Supabase.
                </p>
              </div>
              <div className="rounded-full bg-lime/10 px-3 py-1 text-xs font-semibold text-lime">
                {selectedPlan.price}
              </div>
            </div>

            <div className="grid gap-4">
              {activationMessage && (
                <div className="rounded-xl border border-lime/40 bg-lime/10 p-4">
                  <div className="flex items-start gap-3">
                    <BadgeCheck className="mt-0.5 size-5 text-lime" />
                    <div>
                      <div className="font-display font-semibold text-lime">
                        Plano ativado com sucesso
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{activationMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span>Nome</span>
                  <Input
                    id="checkout-client-name"
                    name="name"
                    autoComplete="name"
                    value={clientName}
                    onChange={(event) => setClientName(event.target.value)}
                    placeholder="Nome do titular"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Documento</span>
                  <Input
                    id="checkout-client-document"
                    name="document"
                    autoComplete="off"
                    inputMode="numeric"
                    value={clientDocument}
                    onChange={(event) => setClientDocument(event.target.value)}
                    placeholder="CPF ou CNPJ"
                  />
                </label>
              </div>

              <label className="space-y-2 text-sm">
                <span>Email</span>
                <Input
                  id="checkout-client-email"
                  name="email"
                  autoComplete="email"
                  type="email"
                  value={clientEmail}
                  onChange={(event) => setClientEmail(event.target.value)}
                  placeholder="seu@email.com"
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  onClick={() => createPixCharge(selectedPlan)}
                  disabled={isCreatingPayment}
                  className="w-full sm:w-auto rounded-xl bg-lime font-semibold text-lime-foreground hover:bg-lime/90"
                >
                  {isCreatingPayment ? "Gerando PIX..." : "Gerar PIX de pagamento"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={refreshPaymentStatus}
                  disabled={!checkout || isRefreshingPayment}
                  className="w-full sm:w-auto rounded-xl"
                >
                  {isRefreshingPayment ? "Atualizando..." : "Verificar status"}
                </Button>
              </div>

              {checkout && (
                <LofyPayPixCheckout
                  paymentCode={checkout.paymentCode}
                  paymentCodeBase64={checkout.paymentCodeBase64}
                  idTransaction={checkout.idTransaction}
                  externalReference={checkout.externalReference}
                  status={checkout.status}
                  onRefreshStatus={refreshPaymentStatus}
                />
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="size-4 text-lime" />
              <h3 className="font-display text-lg font-semibold">
                {isActiveSubscription ? "Beneficios liberados" : "Beneficios inclusos"}
              </h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {(isActiveSubscription ? currentPlan : selectedPlan).benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-secondary/30 px-3 py-2 text-sm"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-lime/15 text-lime">
                    <Check className="size-4" />
                  </span>
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="size-4 text-lime" />
              <h3 className="font-display text-lg font-semibold">Planos sugeridos</h3>
            </div>

            <div className="space-y-3">
              {PLANS.map((plan) => {
                const selected = selectedPlanId === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={cn(
                      "w-full rounded-2xl border p-4 text-left transition-colors",
                      selected
                        ? "border-lime bg-lime/10"
                        : "border-border bg-secondary/20 hover:bg-secondary/40",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-display font-semibold">{plan.name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{plan.summary}</div>
                      </div>
                      {plan.highlight && (
                        <span className="rounded-full bg-lime px-2 py-0.5 text-[10px] font-bold text-lime-foreground">
                          {plan.highlight}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <span className="font-display text-2xl font-semibold">{plan.price}</span>
                        <span className="ml-1 text-xs text-muted-foreground">{plan.cadence}</span>
                      </div>
                      {selected && <BadgeCheck className="size-5 text-lime" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              onClick={() => createPixCharge(selectedPlan)}
              className="mt-4 h-11 w-full rounded-xl bg-lime font-semibold text-lime-foreground hover:bg-lime/90"
            >
              <Zap className="size-4" />
              {isActiveSubscription ? "Renovar com" : "Assinar com"} {selectedPlan.name}
            </Button>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
