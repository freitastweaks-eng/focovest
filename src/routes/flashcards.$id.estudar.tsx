import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, RotateCw, ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { isDue, nextReviewDate, type Rating } from "@/lib/sm2";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/flashcards/$id/estudar")({ component: StudyDeck });

type Card = { id: string; front: string; back: string; deck_id: string };
type Deck = { id: string; title: string; emoji: string; subject: string };

const RATINGS: { key: Rating; label: string; color: string }[] = [
  { key: "forgotten", label: "Não lembrei", color: "bg-red-500 text-white" },
  { key: "hard", label: "Difícil", color: "bg-orange-500 text-white" },
  { key: "good", label: "Bom", color: "bg-blue-500 text-white" },
  { key: "easy", label: "Fácil", color: "bg-lime text-lime-foreground" },
];

function StudyDeck() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [queue, setQueue] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [accuracy, setAccuracy] = useState({ good: 0, total: 0 });
  const [done, setDone] = useState(false);
  const [nextDate, setNextDate] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: d } = await supabase.from("flashcard_decks").select("*").eq("id", id).single();
      const { data: cards } = await supabase.from("flashcards").select("*").eq("deck_id", id);
      if (d) setDeck(d as Deck);
      const allCards = (cards as Card[]) || [];
      if (!user) {
        setQueue(allCards);
        return;
      }
      const { data: revs } = await supabase
        .from("flashcard_reviews")
        .select("flashcard_id, next_review_date")
        .eq("user_id", user.id);
      const map: Record<string, string> = {};
      (revs || []).forEach((r) => (map[r.flashcard_id] = r.next_review_date));
      const dueCards = allCards.filter((c) => isDue(map[c.id]));
      setQueue(dueCards.length ? dueCards : allCards);
    })();
  }, [id, user]);

  const current = queue[idx];
  const progress = queue.length ? (idx / queue.length) * 100 : 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && !done) {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done]);

  async function rate(rating: Rating) {
    if (!current || !user) return;
    const next = nextReviewDate(rating);
    const { data: existing } = await supabase
      .from("flashcard_reviews")
      .select("id, review_count")
      .eq("user_id", user.id)
      .eq("flashcard_id", current.id)
      .maybeSingle();
    if (existing) {
      await supabase
        .from("flashcard_reviews")
        .update({
          rating,
          next_review_date: next,
          review_count: (existing.review_count || 0) + 1,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("flashcard_reviews").insert({
        user_id: user.id,
        flashcard_id: current.id,
        rating,
        next_review_date: next,
        review_count: 1,
      });
    }
    setAccuracy((a) => ({
      good: a.good + (rating === "good" || rating === "easy" ? 1 : 0),
      total: a.total + 1,
    }));

    if (idx + 1 >= queue.length) {
      setDone(true);
      setNextDate(next);
    } else {
      setFlipped(false);
      setIdx(idx + 1);
    }
  }

  if (!deck) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="size-10 animate-spin rounded-full border-2 border-lime border-t-transparent" />
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-6">
        <div className="rounded-3xl border border-border bg-card p-8 text-center">
          <Sparkles className="mx-auto mb-3 size-6 text-lime" />
          <h2 className="font-display text-xl font-semibold">Sem cartões para revisar</h2>
          <p className="mt-2 text-sm text-muted-foreground">Este deck ainda não tem cartões.</p>
          <button
            onClick={() => navigate({ to: "/flashcards" })}
            className="press mt-4 rounded-xl bg-lime px-5 py-2 font-bold text-lime-foreground"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    const pct = accuracy.total ? Math.round((accuracy.good / accuracy.total) * 100) : 0;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background p-6">
        <Confetti />
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center"
        >
          <div className="text-5xl">{deck.emoji}</div>
          <h2 className="mt-3 font-display text-2xl font-bold">Sessão concluída!</h2>
          <p className="mt-1 text-sm text-muted-foreground">{deck.title}</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-secondary/40 p-4">
              <div className="font-display text-2xl font-semibold tabular-nums">
                {accuracy.total}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Revisados
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-lime/10 p-4">
              <div className="font-display text-2xl font-semibold text-lime tabular-nums">
                {pct}%
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Acerto
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Próxima sessão: {new Date(nextDate).toLocaleDateString("pt-BR")}
          </p>
          <button
            onClick={() => navigate({ to: "/flashcards" })}
            className="press mt-6 w-full rounded-xl bg-lime py-3 font-bold text-lime-foreground"
          >
            Voltar aos decks
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <button
          onClick={() => navigate({ to: "/flashcards" })}
          className="press inline-flex items-center gap-1 rounded-lg p-2 hover:bg-secondary"
        >
          <ArrowLeft className="size-4" /> <span className="text-sm">Sair</span>
        </button>
        <div className="min-w-0 flex-1 px-4 text-center text-sm font-semibold">
          {deck.emoji} {deck.title}
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          {idx + 1}/{queue.length}
        </div>
      </header>
      <div className="h-1 w-full bg-secondary">
        <motion.div animate={{ width: `${progress}%` }} className="h-full bg-lime" />
      </div>

      <div className="flex flex-1 items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl">
          <div className="relative w-full" style={{ perspective: "1500px" }}>
            <motion.div
              onClick={() => setFlipped(!flipped)}
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-[3/2] w-full cursor-pointer rounded-3xl"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className="absolute inset-0 flex items-center justify-center rounded-3xl border border-border bg-card p-6 text-center text-xl font-medium md:p-10 md:text-2xl"
                style={{ backfaceVisibility: "hidden" }}
              >
                {current?.front}
                <div className="absolute bottom-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                  toque para virar
                </div>
              </div>
              <div
                className="absolute inset-0 flex items-center justify-center rounded-3xl border border-lime bg-lime/5 p-6 text-center text-xl font-medium md:p-10 md:text-2xl"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                {current?.back}
              </div>
            </motion.div>
          </div>

          <AnimatePresence>
            {flipped && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4"
              >
                {RATINGS.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => rate(r.key)}
                    className={cn("press rounded-xl px-3 py-3 text-sm font-bold", r.color)}
                  >
                    {r.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          {!flipped && (
            <button
              onClick={() => setFlipped(true)}
              className="press mx-auto mt-6 flex items-center gap-1.5 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold"
            >
              <RotateCw className="size-4" /> Mostrar resposta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 60 });
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {pieces.map((_, i) => (
        <motion.span
          key={i}
          initial={{ y: -20, x: Math.random() * window.innerWidth, opacity: 1, rotate: 0 }}
          animate={{ y: window.innerHeight + 50, rotate: 360 + Math.random() * 360, opacity: 0 }}
          transition={{
            duration: 2.5 + Math.random() * 1.5,
            delay: Math.random() * 0.5,
            ease: "easeIn",
          }}
          className="absolute size-2 rounded-sm"
          style={{ background: ["#B8FF4F", "#fbbf24", "#60a5fa", "#f472b6", "#a78bfa"][i % 5] }}
        />
      ))}
    </div>
  );
}
