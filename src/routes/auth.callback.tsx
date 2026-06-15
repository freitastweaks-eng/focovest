import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({ component: AuthCallbackPage });

const ALLOWED_NEXT = new Set(["/dashboard", "/onboarding", "/reset-password"]);

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Confirmando seu acesso...");

  useEffect(() => {
    let active = true;

    const finish = async () => {
      const url = new URL(window.location.href);
      const providerError =
        url.searchParams.get("error_description") || url.searchParams.get("error");
      if (providerError) throw new Error(providerError);

      const nextParam = url.searchParams.get("next") || "/dashboard";
      const next = ALLOWED_NEXT.has(nextParam) ? nextParam : "/dashboard";
      const code = url.searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error && !error.message.toLowerCase().includes("code verifier")) throw error;
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!data.session) throw new Error("O link expirou ou ja foi utilizado.");

      if (!active) return;
      setStatus("success");
      setMessage(
        next === "/reset-password"
          ? "Link validado. Abrindo a troca de senha..."
          : "E-mail confirmado. Sua conta esta pronta.",
      );
      window.setTimeout(() => navigate({ to: next, replace: true }), 700);
    };

    finish().catch((error) => {
      if (!active) return;
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Nao foi possivel validar este link.");
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="glass w-full max-w-md rounded-3xl p-8 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary">
          {status === "loading" && <Loader2 className="size-8 animate-spin text-lime" />}
          {status === "success" && <CheckCircle2 className="size-8 text-lime" />}
          {status === "error" && <TriangleAlert className="size-8 text-amber-400" />}
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold">
          {status === "error" ? "Link invalido" : "Validando sua conta"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        {status === "error" && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              to="/esqueci-senha"
              className="rounded-xl bg-lime px-4 py-2 text-sm font-semibold text-lime-foreground"
            >
              Solicitar novo link
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold"
            >
              Voltar ao login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
