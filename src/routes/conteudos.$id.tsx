import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Bookmark, Check } from "lucide-react";
import { CONTENTS } from "@/lib/data";
import { useAppStore } from "@/store/app-store";
import { PageContainer } from "@/components/page";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/conteudos/$id")({ component: ContentDetail });

function ContentDetail() {
  const { id } = Route.useParams();
  const { bookmarksContent, toggleBookmarkContent, completedContent, toggleCompleteContent } =
    useAppStore();
  const content = CONTENTS.find((c) => c.id === id);
  if (!content) {
    return (
      <PageContainer>
        <h1 className="font-display text-3xl">Conteúdo não encontrado</h1>
        <Link to="/conteudos" className="mt-4 inline-block text-lime">
          ← Voltar
        </Link>
      </PageContainer>
    );
  }
  const saved = bookmarksContent.includes(content.id);
  const done = completedContent.includes(content.id);
  const idx = CONTENTS.findIndex((c) => c.id === content.id);
  const next = CONTENTS[(idx + 1) % CONTENTS.length];

  const sections = content.body.split(/\n##\s+/).map((s, i) => (i === 0 ? s : "## " + s));
  const headings = content.body.match(/^##\s+(.+)$/gm)?.map((h) => h.replace(/^##\s+/, "")) ?? [];

  return (
    <PageContainer className="max-w-4xl">
      <Link
        to="/conteudos"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Conteúdos
      </Link>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-border bg-secondary/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {content.subject}
        </span>
        <span className="rounded-full border border-border bg-secondary/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {content.vestibular}
        </span>
        <span className="text-xs text-muted-foreground">{content.readingTime} min de leitura</span>
      </div>

      <h1 className="font-display text-3xl font-semibold leading-tight sm:text-5xl">
        {content.title}
      </h1>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => toggleCompleteContent(content.id)}
          className={cn(
            "press inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
            done ? "bg-lime text-lime-foreground" : "border border-border bg-secondary/60",
          )}
        >
          <Check className="size-4" />
          {done ? "Concluído" : "Marcar como concluído"}
        </button>
        <button
          onClick={() => toggleBookmarkContent(content.id)}
          className="press inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-2 text-sm font-semibold"
        >
          <Bookmark className={cn("size-4", saved && "fill-lime text-lime")} />
          {saved ? "Salvo" : "Salvar"}
        </button>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_220px]">
        <article className="prose prose-invert max-w-none text-base leading-relaxed">
          {sections.map((s, i) => (
            <RenderSection key={i} content={s} />
          ))}
        </article>

        {headings.length > 0 && (
          <aside className="lg:sticky lg:top-24 self-start rounded-2xl border border-border bg-card p-5 text-sm">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Sumário
            </div>
            <ul className="space-y-1.5 text-muted-foreground">
              {headings.map((h) => (
                <li key={h} className="hover:text-foreground">
                  {h}
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>

      <div className="mt-12 flex justify-end">
        <Link
          to="/conteudos/$id"
          params={{ id: next.id }}
          className="press inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-semibold text-lime-foreground"
        >
          Próximo conteúdo <ArrowRight className="size-4" />
        </Link>
      </div>
    </PageContainer>
  );
}

function RenderSection({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="mb-6">
      {lines.map((line, i) => {
        if (line.startsWith("# "))
          return (
            <h1 key={i} className="font-display text-3xl font-semibold mt-8 mb-4">
              {line.replace(/^#\s+/, "")}
            </h1>
          );
        if (line.startsWith("## "))
          return (
            <h2 key={i} className="font-display text-xl font-semibold mt-6 mb-2">
              {line.replace(/^##\s+/, "")}
            </h2>
          );
        if (line.startsWith("- "))
          return (
            <li key={i} className="ml-5 list-disc text-muted-foreground">
              {line.replace(/^-\s+/, "")}
            </li>
          );
        if (line.trim() === "") return <div key={i} className="h-2" />;
        return (
          <p key={i} className="mb-3 text-muted-foreground">
            {line.replace(/\*\*(.+?)\*\*/g, "$1")}
          </p>
        );
      })}
    </div>
  );
}
