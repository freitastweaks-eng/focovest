import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Bookmark, Check, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { CONTENTS, SUBJECTS, VESTIBULARES } from "@/lib/data";
import { useAppStore } from "@/store/app-store";
import { PageContainer, PageHeader } from "@/components/page";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/conteudos/")({ component: ConteudosPage });

function ConteudosPage() {
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState<string | null>(null);
  const [vest, setVest] = useState<string | null>(null);
  const { bookmarksContent, toggleBookmarkContent, completedContent, toggleCompleteContent } =
    useAppStore();

  const items = useMemo(() => {
    return CONTENTS.filter(
      (c) =>
        (!q || (c.title + c.excerpt).toLowerCase().includes(q.toLowerCase())) &&
        (!subject || c.subject === subject) &&
        (!vest || c.vestibular === vest),
    );
  }, [q, subject, vest]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Conteúdos"
        title="Biblioteca de estudos"
        description="Conteúdo curado por vestibular e por matéria. Tudo em um só lugar."
      />

      <div className="glass mb-4 flex flex-col gap-3 rounded-2xl p-4">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background/50 px-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar conteúdo…"
            className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <FilterRow label="Matéria" options={[...SUBJECTS]} value={subject} onChange={setSubject} />
        <FilterRow label="Vestibular" options={[...VESTIBULARES]} value={vest} onChange={setVest} />
      </div>

      {items.length === 0 ? (
        <Empty />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c, i) => {
            const saved = bookmarksContent.includes(c.id);
            const done = completedContent.includes(c.id);
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="lift group relative flex flex-col rounded-2xl border border-border bg-card p-5"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Tag>{c.subject}</Tag>
                  <Tag>{c.vestibular}</Tag>
                  <DiffBadge level={c.difficulty} />
                </div>
                <h3 className="font-display text-lg font-semibold leading-tight">{c.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.excerpt}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{c.readingTime} min de leitura</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleBookmarkContent(c.id)}
                      className="press flex size-8 items-center justify-center rounded-lg hover:bg-secondary"
                      aria-label="Favoritar"
                    >
                      <Bookmark className={cn("size-4", saved && "fill-lime text-lime")} />
                    </button>
                    <button
                      onClick={() => toggleCompleteContent(c.id)}
                      className={cn(
                        "press flex size-8 items-center justify-center rounded-lg hover:bg-secondary",
                        done && "text-lime",
                      )}
                      aria-label="Marcar como concluído"
                    >
                      <Check className="size-4" />
                    </button>
                  </div>
                </div>
                <Link
                  to="/conteudos/$id"
                  params={{ id: c.id }}
                  className="mt-4 inline-flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary"
                >
                  Ler conteúdo <ArrowRight className="size-4" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Chip active={value === null} onClick={() => onChange(null)}>
          Todos
        </Chip>
        {options.map((o) => (
          <Chip key={o} active={value === o} onClick={() => onChange(o)}>
            {o}
          </Chip>
        ))}
      </div>
    </div>
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
        "press rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-lime bg-lime text-lime-foreground"
          : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  );
}

function DiffBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    Fácil: "bg-lime/20 text-lime border-lime/30",
    Médio: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    Difícil: "bg-red-500/15 text-red-500 border-red-500/30",
  };
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        map[level],
      )}
    >
      {level}
    </span>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
      <div className="mx-auto mb-3 text-4xl">🔍</div>
      <h3 className="font-display text-lg font-semibold">Nada encontrado</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Tente outra combinação de filtros ou termo de busca.
      </p>
    </div>
  );
}
