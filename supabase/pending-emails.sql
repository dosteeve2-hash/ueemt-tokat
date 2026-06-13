-- Run in Supabase SQL Editor after site-settings.sql

CREATE TABLE IF NOT EXISTS public.pending_emails (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "to"       text NOT NULL,
  subject    text NOT NULL,
  body_html  text NOT NULL,
  sent       boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Only admins can read; inserts done via service role (bypasses RLS)
ALTER TABLE public.pending_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read pending_emails"
  ON public.pending_emails FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index for unsent emails
CREATE INDEX IF NOT EXISTS pending_emails_unsent
  ON public.pending_emails (sent, created_at)
  WHERE sent = false;
