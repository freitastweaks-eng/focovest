
-- ============ SIMULADOS ============
CREATE TABLE public.simulados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  vestibular TEXT NOT NULL,
  subject TEXT,
  total_questions INTEGER NOT NULL,
  time_limit_minutes INTEGER NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'Médio',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.simulados TO authenticated;
GRANT ALL ON public.simulados TO service_role;
ALTER TABLE public.simulados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Simulados: select all auth" ON public.simulados FOR SELECT TO authenticated USING (true);

CREATE TABLE public.simulado_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulado_id UUID NOT NULL REFERENCES public.simulados(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  subject TEXT,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  option_e TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A','B','C','D','E')),
  explanation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.simulado_questions TO authenticated;
GRANT ALL ON public.simulado_questions TO service_role;
ALTER TABLE public.simulado_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SimQ: select all auth" ON public.simulado_questions FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_simq_simulado ON public.simulado_questions(simulado_id, question_number);

CREATE TABLE public.simulado_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  simulado_id UUID NOT NULL REFERENCES public.simulados(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage NUMERIC NOT NULL,
  time_spent_minutes INTEGER,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulado_results TO authenticated;
GRANT ALL ON public.simulado_results TO service_role;
ALTER TABLE public.simulado_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SimRes: select own" ON public.simulado_results FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "SimRes: select all for avg" ON public.simulado_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "SimRes: insert own" ON public.simulado_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "SimRes: delete own" ON public.simulado_results FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_simres_user ON public.simulado_results(user_id, completed_at DESC);

-- ============ FLASHCARDS ============
CREATE TABLE public.flashcard_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🃏',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcard_decks TO authenticated;
GRANT ALL ON public.flashcard_decks TO service_role;
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Decks: select default or own" ON public.flashcard_decks FOR SELECT TO authenticated USING (is_default = true OR auth.uid() = user_id);
CREATE POLICY "Decks: insert own" ON public.flashcard_decks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND is_default = false);
CREATE POLICY "Decks: update own" ON public.flashcard_decks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Decks: delete own" ON public.flashcard_decks FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcards TO authenticated;
GRANT ALL ON public.flashcards TO service_role;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cards: select all auth" ON public.flashcards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Cards: insert own deck" ON public.flashcards FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.flashcard_decks d WHERE d.id = deck_id AND d.user_id = auth.uid())
);
CREATE POLICY "Cards: update own deck" ON public.flashcards FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.flashcard_decks d WHERE d.id = deck_id AND d.user_id = auth.uid())
);
CREATE POLICY "Cards: delete own deck" ON public.flashcards FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.flashcard_decks d WHERE d.id = deck_id AND d.user_id = auth.uid())
);
CREATE INDEX idx_cards_deck ON public.flashcards(deck_id);

CREATE TABLE public.flashcard_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK (rating IN ('forgotten','hard','good','easy')),
  next_review_date DATE NOT NULL,
  review_count INTEGER NOT NULL DEFAULT 1,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, flashcard_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcard_reviews TO authenticated;
GRANT ALL ON public.flashcard_reviews TO service_role;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews: select own" ON public.flashcard_reviews FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Reviews: insert own" ON public.flashcard_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Reviews: update own" ON public.flashcard_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Reviews: delete own" ON public.flashcard_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_reviews_user_due ON public.flashcard_reviews(user_id, next_review_date);

-- ============ TOPIC PROGRESS ============
CREATE TABLE public.topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  topic_key TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, subject, topic_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topic_progress TO authenticated;
GRANT ALL ON public.topic_progress TO service_role;
ALTER TABLE public.topic_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "TP: select own" ON public.topic_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "TP: insert own" ON public.topic_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "TP: update own" ON public.topic_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "TP: delete own" ON public.topic_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ QUICK REVIEW ============
CREATE TABLE public.quick_review_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL DEFAULT 10,
  time_seconds INTEGER,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quick_review_results TO authenticated;
GRANT ALL ON public.quick_review_results TO service_role;
ALTER TABLE public.quick_review_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "QR: select own" ON public.quick_review_results FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "QR: insert own" ON public.quick_review_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "QR: delete own" ON public.quick_review_results FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_qr_user ON public.quick_review_results(user_id, completed_at DESC);
