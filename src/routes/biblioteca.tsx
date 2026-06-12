import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Search, Bookmark, Copy } from "lucide-react";
import { toast } from "sonner";
import { REPERTOIRE } from "@/lib/data";
import { useAppStore } from "@/store/app-store";
import { PageContainer, PageHeader } from "@/components/page";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/biblioteca")({ component: BibliotecaPage });

const CAT_COLORS: Record<string, string> = {
  Filosofia: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  "Literatura Brasileira": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "Dados e Estatísticas": "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  "Citações Poderosas": "bg-pink-500/15 text-pink-400 border-pink-500/30",
  "Referências Históricas": "bg-orange-500/15 text-orange-400 border-orange-500/30",
  "Cultura Pop e Contemporânea": "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30",
  "Direitos Humanos & ONU": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Meio Ambiente & Sustentabilidade": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

function BibliotecaPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "saved">("all");
  const { bookmarksRepertoire, toggleBookmarkRepertoire } = useAppStore();

  const cats = Array.from(new Set(REPERTOIRE.map((r) => r.category)));

  const items = useMemo(() => {
    return REPERTOIRE.filter((r) => {
      if (tab === "saved" && !bookmarksRepertoire.includes(r.id)) return false;
      if (cat && r.category !== cat) return false;
      if (q && !(r.source + r.excerpt + r.themes.join(" ")).toLowerCase().includes(q.toLowerCase()))
        return false;
      return true;
    });
  }, [q, cat, tab, bookmarksRepertoire]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Biblioteca de Repertório"
        title="Munição para suas redações"
        description="Filósofos, dados, citações e referências culturais — copie, salve e use."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["all", "saved"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "press rounded-full border px-4 py-1.5 text-sm font-medium",
              tab === t
                ? "border-lime bg-lime text-lime-foreground"
                : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "all" ? "Todos" : "Meu Repertório"}
          </button>
        ))}
      </div>

      <div className="glass mb-4 flex flex-col gap-3 rounded-2xl p-4">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background/50 px-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar autor, tema ou palavra-chave…"
            className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip active={cat === null} onClick={() => setCat(null)}>
            Todas categorias
          </Chip>
          {cats.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
              {c}
            </Chip>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <Empty
          msg={
            tab === "saved"
              ? "Você ainda não salvou nenhum repertório."
              : "Nada encontrado com esses filtros."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r, i) => {
            const saved = bookmarksRepertoire.includes(r.id);
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="lift flex flex-col rounded-2xl border border-border bg-card p-5"
              >
                <span
                  className={cn(
                    "self-start rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    CAT_COLORS[r.category] ?? "border-border bg-secondary text-muted-foreground",
                  )}
                >
                  {r.category}
                </span>
                <div className="mt-3 font-display text-base font-semibold">{r.source}</div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {r.excerpt}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {r.themes.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${r.source} — ${r.excerpt}`);
                      toast.success("Repertório copiado!");
                    }}
                    className="press flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-xs font-semibold hover:bg-secondary"
                  >
                    <Copy className="size-3.5" /> Copiar
                  </button>
                  <button
                    onClick={() => toggleBookmarkRepertoire(r.id)}
                    className={cn(
                      "press flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold",
                      saved
                        ? "bg-lime text-lime-foreground border-lime"
                        : "bg-secondary/40 hover:bg-secondary",
                    )}
                  >
                    <Bookmark className={cn("size-3.5", saved && "fill-current")} />
                    {saved ? "Salvo" : "Salvar"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "press rounded-full border px-3 py-1 text-xs font-medium",
        active
          ? "border-lime bg-lime text-lime-foreground"
          : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
      <div className="mx-auto mb-3 text-4xl">📚</div>
      <p className="text-sm text-muted-foreground">{msg}</p>
    </div>
  );
}
