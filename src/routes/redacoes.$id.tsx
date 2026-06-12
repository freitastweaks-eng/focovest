import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Star, Library } from "lucide-react";
import { ESSAYS } from "@/lib/data";

export const Route = createFileRoute("/redacoes/$id")({ component: EssayDetail });

const COMP_COLORS: Record<number, string> = {
  1: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  2: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  3: "bg-lime/15 text-lime border-lime/30",
  4: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  5: "bg-violet-500/15 text-violet-400 border-violet-500/30",
};

function EssayDetail() {
  const { id } = Route.useParams();
  const essay = ESSAYS.find((e) => e.id === id);
  if (!essay) {
    return (
      <div>
        Redação não encontrada.{" "}
        <Link to="/redacoes" className="text-lime">
          Voltar
        </Link>
      </div>
    );
  }

  const paragraphs = essay.body.split("\n\n");

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to="/redacoes"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Modelos
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-border bg-secondary/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {essay.vestibular} · {essay.year}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-lime/15 px-2.5 py-0.5 text-xs font-bold text-lime">
          <Star className="size-3 fill-lime" /> {essay.score}
        </span>
      </div>

      <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
        {essay.theme}
      </h1>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_260px]">
        <article className="space-y-5 text-base leading-relaxed">
          {paragraphs.map((p, i) => (
            <div key={i} className="relative">
              <span className="absolute -left-10 top-1 hidden font-display text-xs font-bold text-lime lg:block">
                C{i + 1}
              </span>
              <p>{p}</p>
            </div>
          ))}
        </article>

        <aside className="lg:sticky lg:top-24 self-start space-y-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Competências
            </div>
            <ul className="space-y-2">
              {essay.annotations.map((a) => (
                <li
                  key={a.competency}
                  className={`rounded-xl border px-3 py-2 text-xs leading-relaxed ${COMP_COLORS[a.competency]}`}
                >
                  <span className="font-display font-bold">Comp. {a.competency}</span>
                  <p className="mt-1 text-foreground/90">{a.note}</p>
                </li>
              ))}
            </ul>
          </div>

          <Link
            to="/biblioteca"
            className="press flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium hover:bg-secondary"
          >
            <Library className="size-4" />
            Ver repertório relacionado
          </Link>
        </aside>
      </div>
    </div>
  );
}
