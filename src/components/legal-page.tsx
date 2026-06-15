import { Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import { PublicFooter } from "@/components/public-footer";

export function LegalPage({
  eyebrow,
  title,
  updatedAt,
  children,
}: {
  eyebrow: string;
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-card/30">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-lime text-lime-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="font-display font-semibold">VestApp</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-lime"
          >
            <ArrowLeft className="size-4" /> Inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-lime">{eyebrow}</div>
        <h1 className="mt-3 text-3xl font-semibold sm:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">Ultima atualizacao: {updatedAt}</p>
        <article className="mt-8 space-y-8 rounded-3xl border border-border bg-card p-5 text-sm leading-7 sm:p-8 sm:text-base">
          {children}
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-2 space-y-3 text-muted-foreground">{children}</div>
    </section>
  );
}
