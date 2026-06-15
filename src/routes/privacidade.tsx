import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/privacidade")({
  head: () => ({ meta: [{ title: "Privacidade | VestApp" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage eyebrow="LGPD" title="Politica de privacidade" updatedAt="14 de junho de 2026">
      <LegalSection title="1. Quem trata os dados">
        <p>
          O responsavel pela operacao do VestApp atua como controlador dos dados usados para prestar
          a plataforma. O canal para solicitacoes de privacidade esta disponivel na pagina de
          suporte.
        </p>
      </LegalSection>
      <LegalSection title="2. Dados tratados">
        <p>
          Podemos tratar nome, e-mail, identificador da conta, foto de perfil, vestibular alvo,
          progresso de estudos, publicacoes, arquivos enviados, dados tecnicos de acesso e
          informacoes necessarias a pagamentos.
        </p>
        <p>
          O VestApp nao armazena a senha em texto legivel nem os dados bancarios completos do
          usuario.
        </p>
      </LegalSection>
      <LegalSection title="3. Finalidades e bases legais">
        <p>
          Usamos os dados para criar e autenticar a conta, prestar os recursos contratados,
          sincronizar progresso, processar pagamentos, prevenir fraude, atender suporte, cumprir
          obrigacoes legais e melhorar a estabilidade do servico.
        </p>
        <p>
          Conforme o caso, o tratamento se apoia na execucao do contrato, cumprimento de obrigacao
          legal, exercicio regular de direitos, legitimo interesse ou consentimento.
        </p>
      </LegalSection>
      <LegalSection title="4. Compartilhamento e operadores">
        <p>
          Dados podem ser processados por fornecedores de hospedagem, banco de dados, autenticacao,
          armazenamento, monitoramento e pagamento, como Vercel, Supabase e LofyPay, somente na
          medida necessaria ao servico.
        </p>
      </LegalSection>
      <LegalSection title="5. Retencao e seguranca">
        <p>
          Mantemos os dados pelo periodo necessario para operar a conta, cumprir obrigacoes e
          proteger direitos. Aplicamos controle de acesso, conexoes seguras, politicas no banco de
          dados, backups e registro de falhas.
        </p>
      </LegalSection>
      <LegalSection title="6. Direitos do titular">
        <p>
          Voce pode solicitar confirmacao de tratamento, acesso, correcao, portabilidade quando
          aplicavel, informacao sobre compartilhamento, revogacao de consentimento e eliminacao de
          dados tratados com consentimento, observadas as hipoteses legais de conservacao.
        </p>
      </LegalSection>
      <LegalSection title="7. Cookies e armazenamento local">
        <p>
          Utilizamos armazenamento local e cookies tecnicos para manter a sessao, preferencias de
          tema e funcionamento da plataforma. Nao usamos esses recursos para vender dados pessoais.
        </p>
      </LegalSection>
      <LegalSection title="8. Solicitacoes">
        <p>
          Para exercer seus direitos, acesse a{" "}
          <Link to="/suporte" className="font-semibold text-lime">
            pagina de suporte
          </Link>
          . Poderemos solicitar confirmacao de identidade para proteger a conta.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
