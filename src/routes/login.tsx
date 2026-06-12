import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/lib/auth-security";
import { AuthCard, Field, PasswordField } from "./cadastro";

export const Route = createFileRoute("/login")({ component: LoginPage });

const googleAuthEnabled = import.meta.env.VITE_GOOGLE_AUTH_ENABLED === "true";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError("Preencha e-mail e senha antes de entrar.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    setLoading(false);
    if (error) {
      setError(friendlyAuthError(error, "E-mail ou senha incorretos."));
      return;
    }
    toast.success("Bem-vindo de volta! 👋");
    navigate({ to: "/dashboard" });
  };

  const google = async () => {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      setError("Falha ao entrar com Google.");
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Bem-vindo de volta"
      subtitle="Entre para continuar seus estudos"
      error={error}
      loading={loading}
      onSubmit={submit}
      onGoogle={googleAuthEnabled ? google : undefined}
      submitLabel="Entrar"
      footer={
        <>
          Não tem conta?{" "}
          <Link to="/cadastro" className="font-semibold text-lime">
            Criar conta →
          </Link>
        </>
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
      <PasswordField
        label="Senha"
        value={password}
        onChange={setPassword}
        show={show}
        toggle={() => setShow((s) => !s)}
        autoComplete="current-password"
      />
      <div className="text-right">
        <Link
          to="/esqueci-senha"
          className="text-xs font-medium text-muted-foreground hover:text-lime"
        >
          Esqueci minha senha
        </Link>
      </div>
    </AuthCard>
  );
}
