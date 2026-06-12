import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Save, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { THEMES, REPERTOIRE } from "@/lib/data";
import { useAppStore } from "@/store/app-store";
import type { EssayDraft } from "@/store/app-store";

export const Route = createFileRoute("/redacoes/escrever")({
  component: EscreverPage,
  validateSearch: (s: Record<string, unknown>) => ({
    theme: typeof s.theme === "string" ? s.theme : undefined,
    id: typeof s.id === "string" ? s.id : undefined,
  }),
});

const STRUCTURE = [
  { label: "Introdução", target: 90 },
  { label: "Desenvolvimento 1", target: 130 },
  { label: "Desenvolvimento 2", target: 130 },
  { label: "Conclusão", target: 100 },
];

function EscreverPage() {
  const search = Route.useSearch();
  const { drafts, saveDraft } = useAppStore();
  const existing = search.id ? drafts.find((d) => d.id === search.id) : undefined;

  const [theme, setTheme] = useState<string>(existing?.theme ?? search.theme ?? THEMES[0].title);
  const [body, setBody] = useState(existing?.body ?? "");
  const idRef = useRef<string>(existing?.id ?? crypto.randomUUID());

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  // autosave
  useEffect(() => {
    const t = setTimeout(() => {
      if (!body.trim()) return;
      const draft: EssayDraft = {
        id: idRef.current,
        theme,
        body,
        status: "Rascunho",
        updatedAt: Date.now(),
      };
      saveDraft(draft);
    }, 1500);
    return () => clearTimeout(t);
  }, [body, theme, saveDraft]);

  const suggestions = useMemo(() => {
    const themeLower = theme.toLowerCase();
    return REPERTOIRE.filter((r) =>
      r.themes.some(
        (t) =>
          themeLower.includes(t.toLowerCase()) ||
          t.toLowerCase().includes(themeLower.split(" ")[0]),
      ),
    ).slice(0, 5);
  }, [theme]);

  const handleSave = (status: "Rascunho" | "Concluída") => {
    const draft: EssayDraft = {
      id: idRef.current,
      theme,
      body,
      status,
      updatedAt: Date.now(),
    };
    saveDraft(draft);
    toast.success(status === "Concluída" ? "Redação concluída ✅" : "Rascunho salvo");
  };

  const handleExport = () => {
    const blob = new Blob([`${theme}\n\n${body}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `redacao-${theme.slice(0, 30)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Download iniciado");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="rounded-2xl border border-border bg-card p-5">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Tema
        </label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="mb-4 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium outline-none focus:border-lime"
        >
          {THEMES.map((t) => (
            <option key={t.id}>{t.title}</option>
          ))}
        </select>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Comece sua redação aqui…"
          className="min-h-[480px] w-full resize-y rounded-xl border border-border bg-background p-4 text-base leading-relaxed outline-none focus:border-lime"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground tabular-nums">
            <span className="font-semibold text-foreground">{wordCount}</span> palavras
            <span className="ml-2 text-xs">(meta: 450)</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSave("Rascunho")}
              className="press inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 py-2 text-sm font-semibold"
            >
              <Save className="size-4" /> Salvar
            </button>
            <button
              onClick={handleExport}
              className="press inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 py-2 text-sm font-semibold"
            >
              <Download className="size-4" /> Exportar
            </button>
            <button
              onClick={() => handleSave("Concluída")}
              className="press inline-flex items-center gap-1.5 rounded-xl bg-lime px-4 py-2 text-sm font-bold text-lime-foreground"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Estrutura
          </div>
          <ul className="space-y-2 text-sm">
            {STRUCTURE.map((s) => (
              <li
                key={s.label}
                className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-1.5"
              >
                <span>{s.label}</span>
                <span className="text-xs text-muted-foreground">~{s.target} palavras</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Sparkles className="size-3.5 text-lime" /> Repertório sugerido
          </div>
          {suggestions.length === 0 ? (
            <p className="text-xs text-muted-foreground">Selecione um tema para ver sugestões.</p>
          ) : (
            <ul className="space-y-2">
              {suggestions.map((r) => (
                <li
                  key={r.id}
                  className="rounded-lg border border-border bg-secondary/30 p-2.5 text-xs"
                >
                  <div className="font-semibold">{r.source}</div>
                  <p className="mt-1 line-clamp-3 text-muted-foreground">{r.excerpt}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
