import { createFileRoute } from "@tanstack/react-router";
import { Mail, ShieldCheck, CreditCard, KeyRound } from "lucide-react";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/suporte")({
  head: () => ({ meta: [{ title: "Suporte | VestApp" }] }),
  component: SupportPage,
});

const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || "suporte@focovest.com.br";

function SupportPage() {
  const subject = encodeURIComponent("Suporte VestApp");
  return (
    <LegalPage eyebrow="Atendimento" title="Como podemos ajudar?" updatedAt="14 de junho de 2026">
      <div className="rounded-2xl border border-lime/30 bg-lime/10 p-5">
        <div className="flex items-start gap-3">
          <Mail className="mt-1 size-5 shrink-0 text-lime" />
          <div>
            <h2 className="font-display text-lg font-semibold">Contato por e-mail</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Informe o e-mail da conta e descreva o problema. Nunca envie sua senha, codigo de
              verificacao ou chave PIX.
            </p>
            <a
              href={`mailto:${supportEmail}?subject=${subject}`}
              className="mt-4 inline-flex rounded-xl bg-lime px-4 py-2 text-sm font-semibold text-lime-foreground"
            >
              {supportEmail}
            </a>
          </div>
        </div>
      </div>
      <LegalSection title="Problemas de acesso">
        <p className="flex gap-2">
          <KeyRound className="mt-1 size-4 shrink-0 text-lime" />
          Use a opcao Esqueci minha senha na tela de login. Confira tambem spam e promocoes antes de
          solicitar outro e-mail.
        </p>
      </LegalSection>
      <LegalSection title="Pagamento e assinatura">
        <p className="flex gap-2">
          <CreditCard className="mt-1 size-4 shrink-0 text-lime" />
          Envie o identificador da transacao exibido no checkout, sem encaminhar documentos
          completos ou dados bancarios.
        </p>
      </LegalSection>
      <LegalSection title="Privacidade e seguranca">
        <p className="flex gap-2">
          <ShieldCheck className="mt-1 size-4 shrink-0 text-lime" />
          Para corrigir ou excluir dados, use o assunto Privacidade no e-mail e informe exatamente
          qual direito deseja exercer.
        </p>
      </LegalSection>
      <LegalSection title="Prazo de resposta">
        <p>
          Buscamos responder solicitacoes comuns em ate 2 dias uteis. Incidentes de seguranca e
          pagamentos recebem prioridade.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
