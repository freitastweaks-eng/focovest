import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Plus, Play, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/page";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SUBJECTS } from "@/lib/data";
import { isDue } from "@/lib/sm2";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/flashcards/")({ component: FlashcardsPage });

type Deck = {
  id: string;
  user_id: string | null;
  title: string;
  subject: string;
  emoji: string;
  is_default: boolean;
};
type CardRow = { id: string; deck_id: string };
type Review = { flashcard_id: string; next_review_date: string };

function FlashcardsPage() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cardCounts, setCardCounts] = useState<Record<string, number>>({});
  const [dueByDeck, setDueByDeck] = useState<Record<string, number>>({});
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    const { data: ds } = await supabase
      .from("flashcard_decks")
      .select("*")
      .order("is_default", { ascending: false });
    const all = (ds as Deck[]) || [];
    setDecks(all);

    const { data: cards } = await supabase.from("flashcards").select("id, deck_id");
    const counts: Record<string, number> = {};
    const byDeck: Record<string, string[]> = {};
    ((cards as CardRow[]) || []).forEach((c) => {
      counts[c.deck_id] = (counts[c.deck_id] || 0) + 1;
      (byDeck[c.deck_id] = byDeck[c.deck_id] || []).push(c.id);
    });
    setCardCounts(counts);

    if (user) {
      const { data: revs } = await supabase
        .from("flashcard_reviews")
        .select("flashcard_id, next_review_date")
        .eq("user_id", user.id);
      const reviewMap: Record<string, string> = {};
      ((revs as Review[]) || []).forEach((r) => (reviewMap[r.flashcard_id] = r.next_review_date));
      const due: Record<string, number> = {};
      Object.entries(byDeck).forEach(([deckId, ids]) => {
        due[deckId] = ids.filter((id) => isDue(reviewMap[id])).length;
      });
      setDueByDeck(due);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const defaults = decks.filter((d) => d.is_default);
  const mine = decks.filter((d) => !d.is_default && d.user_id === user?.id);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Flashcards"
        title="Memorize mais, esqueça menos"
        description="Repetição espaçada para fixar fórmulas, datas e conceitos."
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="press inline-flex items-center gap-1.5 rounded-xl bg-lime px-4 py-2 text-sm font-bold text-lime-foreground"
          >
            <Plus className="size-4" /> Novo deck
          </button>
        }
      />

      <h2 className="mb-3 font-display text-lg font-semibold">Decks disponíveis</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {defaults.map((d, i) => (
          <DeckCard
            key={d.id}
            deck={d}
            count={cardCounts[d.id] || 0}
            due={dueByDeck[d.id] || 0}
            index={i}
          />
        ))}
      </div>

      <h2 className="mb-3 mt-8 font-display text-lg font-semibold">Meus decks</h2>
      {mine.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
          <Sparkles className="mx-auto mb-2 size-5 text-lime" />
          Crie seu primeiro deck personalizado clicando em "Novo deck".
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mine.map((d, i) => (
            <DeckCard
              key={d.id}
              deck={d}
              count={cardCounts[d.id] || 0}
              due={dueByDeck[d.id] || 0}
              index={i}
              onDeleted={load}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateDeckModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </PageContainer>
  );
}

function DeckCard({
  deck,
  count,
  due,
  index,
  onDeleted,
}: {
  deck: Deck;
  count: number;
  due: number;
  index: number;
  onDeleted?: () => void;
}) {
  async function handleDelete() {
    if (!confirm("Apagar este deck?")) return;
    await supabase.from("flashcard_decks").delete().eq("id", deck.id);
    toast.success("Deck apagado");
    onDeleted?.();
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="lift relative rounded-2xl border border-border bg-card p-5"
    >
      <div className="mb-3 flex items-start justify-between">
        <span className="text-3xl">{deck.emoji}</span>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          {deck.subject}
        </span>
      </div>
      <h3 className="font-display text-base font-semibold leading-snug">{deck.title}</h3>
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span>{count} cartões</span>
        {due > 0 && (
          <span className="rounded-full bg-lime/15 px-2 py-0.5 font-bold text-lime">
            {due} para hoje
          </span>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <Link
          to="/flashcards/$id/estudar"
          params={{ id: deck.id }}
          className="press inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-lime px-3 py-2 text-sm font-bold text-lime-foreground"
        >
          <Play className="size-4" /> Estudar
        </Link>
        {onDeleted && (
          <button
            onClick={handleDelete}
            className="press rounded-xl border border-border bg-card p-2 text-muted-foreground hover:text-red-500"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function CreateDeckModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [emoji, setEmoji] = useState("🃏");
  const [bulk, setBulk] = useState("");
  const [cards, setCards] = useState<{ front: string; back: string }[]>([{ front: "", back: "" }]);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!user) return;
    if (!title.trim()) return toast.error("Dê um título ao deck");
    const list = cards.filter((c) => c.front.trim() && c.back.trim());
    if (list.length === 0) return toast.error("Adicione pelo menos um cartão");
    setSaving(true);
    const { data: deck, error } = await supabase
      .from("flashcard_decks")
      .insert({ user_id: user.id, title, subject, emoji, is_default: false })
      .select()
      .single();
    if (error || !deck) {
      setSaving(false);
      return toast.error("Erro ao criar deck");
    }
    await supabase
      .from("flashcards")
      .insert(list.map((c) => ({ deck_id: deck.id, front: c.front, back: c.back })));
    toast.success("Deck criado!");
    setSaving(false);
    onCreated();
  }

  function importBulk() {
    const lines = bulk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const newCards = lines
      .map((l) => {
        const [front, back] = l.split(/[,;|]/).map((s) => s.trim());
        return { front: front || "", back: back || "" };
      })
      .filter((c) => c.front && c.back);
    if (newCards.length === 0)
      return toast.error("Use formato: pergunta, resposta (uma por linha)");
    setCards([...cards.filter((c) => c.front || c.back), ...newCards]);
    setBulk("");
    toast.success(`${newCards.length} cartões adicionados`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-t-3xl bg-card p-6 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Novo deck</h2>
          <button onClick={onClose} className="press rounded-lg p-2 hover:bg-secondary">
            <X className="size-4" />
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-[100px_1fr_1fr]">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="🃏"
            className="rounded-xl border border-border bg-background px-3 py-2 text-center text-2xl outline-none focus:border-lime"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do deck"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
          />
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
          >
            {SUBJECTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="mt-4 max-h-[40vh] space-y-2 overflow-y-auto pr-1">
          {cards.map((c, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-2">
              <input
                value={c.front}
                placeholder={`Frente ${i + 1}`}
                onChange={(e) => {
                  const n = [...cards];
                  n[i] = { ...n[i], front: e.target.value };
                  setCards(n);
                }}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
              />
              <div className="flex gap-2">
                <input
                  value={c.back}
                  placeholder="Verso"
                  onChange={(e) => {
                    const n = [...cards];
                    n[i] = { ...n[i], back: e.target.value };
                    setCards(n);
                  }}
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
                />
                {cards.length > 1 && (
                  <button
                    onClick={() => setCards(cards.filter((_, j) => j !== i))}
                    className="press rounded-xl border border-border bg-card px-2 text-muted-foreground hover:text-red-500"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setCards([...cards, { front: "", back: "" }])}
          className="press mt-2 inline-flex items-center gap-1 text-xs font-semibold text-lime"
        >
          <Plus className="size-3.5" /> Adicionar cartão
        </button>

        <details className="mt-4 rounded-xl border border-border bg-secondary/30 p-3">
          <summary className="cursor-pointer text-xs font-semibold">Importar em massa</summary>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Formato: <code>pergunta, resposta</code> — uma por linha.
          </p>
          <textarea
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            rows={4}
            className="mt-2 w-full rounded-lg border border-border bg-background p-2 text-xs outline-none focus:border-lime"
            placeholder="Capital do Brasil, Brasília&#10;Ano da independência, 1822"
          />
          <button
            onClick={importBulk}
            className="press mt-2 rounded-lg bg-secondary px-3 py-1 text-xs font-semibold"
          >
            Importar
          </button>
        </details>

        <button
          onClick={save}
          disabled={saving}
          className="press mt-4 w-full rounded-xl bg-lime py-3 font-bold text-lime-foreground disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Criar deck"}
        </button>
      </motion.div>
    </div>
  );
}
