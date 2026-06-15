# Operacao do VestApp

## Configuracao obrigatoria

- Configure `VITE_SUPPORT_EMAIL` no Vercel com um endereco que seja acompanhado.
- Configure `SUPABASE_SERVICE_ROLE_KEY` apenas no ambiente do servidor.
- Adicione o secret `SUPABASE_DB_URL` no GitHub Actions. Use a connection string direta do banco Supabase, com SSL habilitado.
- Aplique todas as migrations de `supabase/migrations` no projeto remoto.
- No Supabase Auth, inclua nas Redirect URLs:
  - `https://SEU-DOMINIO/auth/callback`
  - `http://127.0.0.1:5173/auth/callback`

## Monitoramento

Erros de navegador e falhas fatais do React sao enviados para `app_error_events`. A tabela nao permite leitura ou escrita pelos papeis `anon` e `authenticated`; apenas o servidor com service role registra eventos.

Consulta operacional sugerida no SQL Editor:

```sql
select created_at, source, route, message, release
from public.app_error_events
order by created_at desc
limit 100;
```

Defina uma rotina semanal para revisar os eventos e apagar registros antigos quando nao forem mais necessarios.

## Backups

O workflow `.github/workflows/supabase-backup.yml` roda diariamente e mantem os dumps por 14 dias como artifacts privados do GitHub Actions. Rode o workflow manualmente depois de configurar o secret e confirme que o arquivo tem tamanho coerente.

Teste de restauracao recomendado mensalmente:

```bash
createdb focovest_restore_test
pg_restore --no-owner --no-privileges --dbname focovest_restore_test backup.dump
```

Um backup sem teste de restauracao nao deve ser considerado confiavel.

## Checklist antes de divulgar

- Cadastro e confirmacao testados com um e-mail controlado pela equipe.
- Recuperacao de senha testada com link novo e link expirado.
- Compra PIX e ativacao da assinatura testadas em producao.
- E-mail de suporte funcionando.
- Primeiro backup manual concluido e restauracao validada.
- Termos e Privacidade revisados por profissional juridico.
