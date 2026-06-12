
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  event_type TEXT NOT NULL DEFAULT 'study',
  color TEXT NOT NULL DEFAULT '#B8FF4F',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CalEvents: select own" ON public.calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "CalEvents: insert own" ON public.calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "CalEvents: update own" ON public.calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "CalEvents: delete own" ON public.calendar_events FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_calendar_events_user_starts ON public.calendar_events(user_id, starts_at);

CREATE TRIGGER trg_calendar_events_updated_at
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
