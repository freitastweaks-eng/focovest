import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError, validatePassword } from "@/lib/auth-security";
import { AuthCard, PasswordField } from "./cadastro";

export const Route = createFileRoute("/reset-password")({ component: ResetPage });

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingLink, setCheckingLink] = useState(true);
  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setValidSession(Boolean(data.session));
      setCheckingLink(false);
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const passwordError = validatePassword(password);
    if (passwordError) return setError(passwordError);
    if (password !== confirm) return setError("As senhas não coincidem.");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(friendlyAuthError(error, "Não foi possível atualizar a senha."));
    toast.success("Senha atualizada! 🎉");
    navigate({ to: "/dashboard" });
  };

  if (checkingLink) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-background">
        <div className="size-10 animate-spin rounded-full border-2 border-lime border-t-transparent" />
      </div>
    );
  }

  if (!validSession) {
    return (
      <AuthCard
        title="Link invalido ou expirado"
        subtitle="Solicite um novo link para redefinir sua senha"
        error={null}
        loading={false}
        onSubmit={() => navigate({ to: "/esqueci-senha" })}
        submitLabel="Solicitar novo link"
        footer={<></>}
      />
    );
  }

  return (
    <AuthCard
      title="Nova senha"
      subtitle="Defina uma nova senha para sua conta"
      error={error}
      loading={loading}
      onSubmit={submit}
      submitLabel="Salvar nova senha"
      footer={<></>}
    >
      <PasswordField
        label="Nova senha"
        value={password}
        onChange={setPassword}
        show={show}
        toggle={() => setShow((s) => !s)}
        name="new-password"
      />
      <PasswordField
        label="Confirmar senha"
        value={confirm}
        onChange={setConfirm}
        show={show}
        toggle={() => setShow((s) => !s)}
        name="confirm-password"
      />
    </AuthCard>
  );
}
