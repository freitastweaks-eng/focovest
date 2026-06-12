import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, FileText } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/redacoes/minhas")({ component: MinhasPage });

function MinhasPage() {
  const { drafts, removeDraft } = useAppStore();

  if (drafts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
        <div className="mx-auto mb-3 text-4xl">✍️</div>
        <h3 className="font-display text-lg font-semibold">Nenhuma redação ainda</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Comece escrevendo sobre um tema. Seus rascunhos aparecem aqui automaticamente.
        </p>
        <Link
          to="/redacoes/escrever"
          search={{ theme: undefined, id: undefined }}
          className="press mt-4 inline-flex items-center gap-2 rounded-full bg-lime px-4 py-2 text-sm font-bold text-lime-foreground"
        >
          Começar a escrever
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {drafts.map((d) => {
        const words = d.body.trim() ? d.body.trim().split(/\s+/).length : 0;
        return (
          <div
            key={d.id}
            className="lift flex flex-col rounded-2xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex items-center justify-between">
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  d.status === "Concluída"
                    ? "border-lime/30 bg-lime/15 text-lime"
                    : "border-border bg-secondary text-muted-foreground",
                )}
              >
                {d.status}
              </span>
              <button
                onClick={() => removeDraft(d.id)}
                className="press text-muted-foreground hover:text-red-400"
                aria-label="Excluir"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <h3 className="line-clamp-2 font-display text-base font-semibold">{d.theme}</h3>
            <div className="mt-2 text-xs text-muted-foreground">
              {words} palavras · {new Date(d.updatedAt).toLocaleDateString("pt-BR")}
            </div>
            <Link
              to="/redacoes/escrever"
              search={{ id: d.id, theme: undefined }}
              className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm font-medium hover:bg-secondary"
            >
              <FileText className="size-4" />
              Continuar
            </Link>
          </div>
        );
      })}
    </div>
  );
}
