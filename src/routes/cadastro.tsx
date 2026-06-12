import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { Eye, EyeOff, Sparkles, Loader2, MailCheck, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError, MIN_PASSWORD_LENGTH, validatePassword } from "@/lib/auth-security";

export const Route = createFileRoute("/cadastro")({ component: CadastroPage });

const googleAuthEnabled = import.meta.env.VITE_GOOGLE_AUTH_ENABLED === "true";

function CadastroPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [showLaunchNotice, setShowLaunchNotice] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedName.length < 2) return setError("Informe seu nome completo.");
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return setError("E-mail inválido.");
    const passwordError = validatePassword(password);
    if (passwordError) return setError(passwordError);
    if (password !== confirm) return setError("As senhas não coincidem.");

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { name: normalizedName },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setLoading(false);
    if (error) {
      setError(
        friendlyAuthError(
          error,
          "Não foi possível criar a conta. Revise os dados e tente novamente.",
        ),
      );
      return;
    }

    if (!data.session) {
      setConfirmationEmail(normalizedEmail);
      return;
    }

    toast.success("Conta criada! Bem-vindo ao VestApp 🎉");
    setShowLaunchNotice(true);
  };

  const continueAfterLaunchNotice = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/onboarding" });
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

  const resendConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationEmail) return;

    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: confirmationEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setLoading(false);

    if (error) {
      setError("Não foi possível reenviar o e-mail. Tente novamente em instantes.");
      return;
    }

    toast.success("E-mail de confirmação reenviado.");
  };

  if (confirmationEmail) {
    return (
      <AuthCard
        title="Confirme seu e-mail"
        subtitle={`Enviamos um link de confirmação para ${confirmationEmail}`}
        error={error}
        loading={loading}
        onSubmit={resendConfirmation}
        submitLabel="Reenviar e-mail"
        footer={
          <>
            Já confirmou?{" "}
            <Link to="/login" className="font-semibold text-lime">
              Entrar →
            </Link>
          </>
        }
        extraTop={
          <>
            <div className="mt-6 flex gap-3 rounded-xl border border-lime/25 bg-lime/10 p-4 text-sm text-muted-foreground">
            <MailCheck className="mt-0.5 size-5 shrink-0 text-lime" />
            <p>Abra o link recebido para ativar sua conta. Verifique também a caixa de spam.</p>
            </div>
            <div className="mt-3">
              <LaunchNotice />
            </div>
          </>
        }
      />
    );
  }

  if (showLaunchNotice) {
    return (
      <AuthCard
        title="Sua conta foi criada"
        subtitle="Bem-vindo ao lançamento do VestApp"
        error={error}
        loading={false}
        onSubmit={continueAfterLaunchNotice}
        submitLabel="Continuar"
        footer={
          <>
            Obrigado por chegar no começo.{" "}
            <Link to="/" className="font-semibold text-lime">
              Ver início
            </Link>
          </>
        }
        extraTop={<LaunchNotice />}
      />
    );
  }

  return (
    <AuthCard
      title="Criar sua conta"
      subtitle="Junte-se a milhares de vestibulandos"
      error={error}
      loading={loading}
      onGoogle={googleAuthEnabled ? google : undefined}
      footer={
        <>
          Já tem conta?{" "}
          <Link to="/login" className="font-semibold text-lime">
            Entrar →
          </Link>
        </>
      }
      onSubmit={submit}
      submitLabel="Criar conta"
    >
      <Field
        label="Nome completo"
        value={name}
        onChange={setName}
        placeholder="Como você se chama?"
        name="name"
        autoComplete="name"
        maxLength={100}
      />
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
        show={showPw}
        toggle={() => setShowPw((s) => !s)}
      />
      <PasswordField
        label="Confirmar senha"
        value={confirm}
        onChange={setConfirm}
        show={showPw}
        toggle={() => setShowPw((s) => !s)}
      />
    </AuthCard>
  );
}

function LaunchNotice() {
  return (
    <div className="flex gap-3 rounded-xl border border-sky-400/25 bg-sky-400/10 p-4 text-sm text-muted-foreground">
      <Megaphone className="mt-0.5 size-5 shrink-0 text-sky-300" />
      <div className="space-y-1">
        <p className="font-semibold text-foreground">Estamos em fase de lançamento.</p>
        <p>
          O site vai passar por atualizações nos próximos dias, com melhorias, ajustes e novidades
          chegando aos poucos para deixar a experiência mais completa.
        </p>
      </div>
    </div>
  );
}

export function AuthCard({
  title,
  subtitle,
  children,
  error,
  loading,
  onSubmit,
  onGoogle,
  submitLabel,
  footer,
  extraTop,
}: {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  error: string | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onGoogle?: () => void;
  submitLabel: string;
  footer: React.ReactNode;
  extraTop?: React.ReactNode;
}) {
  return (
    <div className="dark relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 size-[480px] rounded-full bg-lime/15 blur-[140px]" />
        <div className="absolute -right-32 bottom-0 size-[480px] rounded-full bg-indigo-500/15 blur-[140px]" />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <Link to="/" className="mb-8 flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-lime text-lime-foreground accent-glow">
            <Sparkles className="size-4" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-semibold">VestApp</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass w-full max-w-[460px] rounded-3xl p-8 shadow-2xl"
        >
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

          {extraTop}

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            {children}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="press inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime font-display text-base font-semibold text-lime-foreground disabled:opacity-60"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : submitLabel}
            </button>
          </form>

          {onGoogle && (
            <>
              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                ou continue com
                <div className="h-px flex-1 bg-border" />
              </div>
              <button
                type="button"
                onClick={onGoogle}
                disabled={loading}
                className="press inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-secondary disabled:opacity-60"
              >
                <GoogleIcon /> Continuar com Google
              </button>
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
        </motion.div>
      </div>
    </div>
  );
}

export function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  name,
  autoComplete,
  maxLength,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  name?: string;
  autoComplete?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        required
        className="h-12 w-full rounded-xl border border-border bg-background/60 px-4 text-sm outline-none transition-colors focus:border-lime"
      />
    </div>
  );
}

export function PasswordField({
  label,
  value,
  onChange,
  show,
  toggle,
  autoComplete = "new-password",
  name,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  toggle: () => void;
  autoComplete?: string;
  name?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          name={name ?? (autoComplete === "current-password" ? "current-password" : "new-password")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          autoComplete={autoComplete}
          minLength={MIN_PASSWORD_LENGTH}
          required
          className="h-12 w-full rounded-xl border border-border bg-background/60 px-4 pr-12 text-sm outline-none transition-colors focus:border-lime"
        />
        <button
          type="button"
          onClick={toggle}
          className="press absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.579c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.167 6.656 3.579 9 3.579z"
        fill="#EA4335"
      />
    </svg>
  );
}
