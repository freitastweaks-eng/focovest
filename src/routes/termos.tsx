import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/termos")({
  head: () => ({ meta: [{ title: "Termos de uso | VestApp" }] }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Termos de uso" updatedAt="14 de junho de 2026">
      <LegalSection title="1. Aceitacao">
        <p>
          Ao criar uma conta ou utilizar o VestApp, voce concorda com estes termos e com a nossa
          Politica de Privacidade.
        </p>
      </LegalSection>
      <LegalSection title="2. Finalidade da plataforma">
        <p>
          O VestApp oferece ferramentas de organizacao, conteudos educacionais e recursos
          colaborativos para preparacao academica. A plataforma nao garante aprovacao, nota ou
          resultado especifico.
        </p>
      </LegalSection>
      <LegalSection title="3. Conta e seguranca">
        <p>
          Voce deve fornecer dados corretos, proteger suas credenciais e comunicar acessos
          indevidos. Contas nao podem ser cedidas, vendidas ou utilizadas para violar direitos de
          terceiros.
        </p>
      </LegalSection>
      <LegalSection title="4. Conteudo do usuario">
        <p>
          Voce mantem a titularidade do que publica, mas concede ao VestApp permissao limitada para
          armazenar, processar e exibir esse material somente para operar os recursos solicitados.
        </p>
        <p>
          E proibido publicar material ilegal, ofensivo, fraudulento, que viole direitos autorais ou
          exponha dados pessoais de terceiros sem autorizacao.
        </p>
      </LegalSection>
      <LegalSection title="5. Planos e pagamentos">
        <p>
          Precos, duracao e beneficios sao exibidos antes da contratacao. Pagamentos podem ser
          processados por prestadores especializados. A ativacao depende da confirmacao do
          pagamento.
        </p>
        <p>
          Solicitacoes de cancelamento, cobranca ou reembolso devem ser encaminhadas pelo canal de
          suporte e serao analisadas conforme a legislacao aplicavel.
        </p>
      </LegalSection>
      <LegalSection title="6. Disponibilidade e alteracoes">
        <p>
          Podemos realizar manutencoes, corrigir falhas e atualizar funcionalidades. Mudancas
          relevantes nestes termos serao publicadas com nova data de atualizacao.
        </p>
      </LegalSection>
      <LegalSection title="7. Suspensao">
        <p>
          Podemos limitar ou suspender contas em caso de fraude, abuso, risco de seguranca ou
          violacao destes termos, preservado o direito de contestacao pelo suporte.
        </p>
      </LegalSection>
      <LegalSection title="8. Contato">
        <p>
          Duvidas sobre estes termos podem ser enviadas pela{" "}
          <Link to="/suporte" className="font-semibold text-lime">
            pagina de suporte
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
