import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/lib/auth-security";
import { AuthCard, Field } from "./cadastro";

export const Route = createFileRoute("/esqueci-senha")({ component: ForgotPage });

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return setError(friendlyAuthError(error, "Não foi possível enviar o link agora."));
    setEmail(normalizedEmail);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="dark relative flex min-h-screen items-center justify-center bg-background px-4">
        <div className="glass w-full max-w-[460px] rounded-3xl p-10 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-lime/15">
            <CheckCircle2 className="size-8 text-lime" />
          </div>
          <h1 className="font-display text-2xl font-semibold">Verifique seu e-mail!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enviamos um link de recuperação para{" "}
            <span className="font-semibold text-foreground">{email}</span>.
          </p>
          <Link
            to="/login"
            className="press mt-6 inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-bold text-lime-foreground"
          >
            Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AuthCard
      title="Recuperar senha"
      subtitle="Enviaremos um link de redefinição"
      error={error}
      loading={loading}
      onSubmit={submit}
      submitLabel="Enviar link de recuperação"
      footer={
        <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-lime">
          <ArrowLeft className="size-3" /> Voltar para login
        </Link>
      }
    >
      <Field
        label="E-mail"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="voce@exemplo.com"
        name="email"
        autoComplete="email"
        maxLength={320}
      />
    </AuthCard>
  );
}
