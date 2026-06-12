
-- 1. Flashcards: restrict SELECT
DROP POLICY IF EXISTS "Cards: select all auth" ON public.flashcards;
CREATE POLICY "Cards: select own or default" ON public.flashcards
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.flashcard_decks d
    WHERE d.id = flashcards.deck_id
      AND (d.user_id = auth.uid() OR d.is_default = true)
  )
);

-- 2. Simulado results: drop the public-read policy, add aggregate function
DROP POLICY IF EXISTS "SimRes: select all for avg" ON public.simulado_results;

CREATE OR REPLACE FUNCTION public.get_simulado_aggregate(_simulado_id uuid)
RETURNS TABLE(avg_score numeric, avg_percentage numeric, total_attempts bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    AVG(score)::numeric AS avg_score,
    AVG(percentage)::numeric AS avg_percentage,
    COUNT(*)::bigint AS total_attempts
  FROM public.simulado_results
  WHERE simulado_id = _simulado_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_simulado_aggregate(uuid) TO authenticated, anon;

-- 3. Premium waitlist: restrict INSERT to authenticated users for their own row
DROP POLICY IF EXISTS "Waitlist: anyone insert" ON public.premium_waitlist;
CREATE POLICY "Waitlist: insert own" ON public.premium_waitlist
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND email IS NOT NULL
  AND char_length(email) <= 320
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);

-- 4. Storage community-files: add SELECT policy (authenticated only)
CREATE POLICY "Community files: authenticated read"
ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'community-files');

-- Make the bucket private so URLs require signed access
UPDATE storage.buckets SET public = false WHERE id = 'community-files';
