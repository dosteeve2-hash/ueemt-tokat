-- Run this in Supabase SQL Editor (one-time setup)

CREATE TABLE IF NOT EXISTS public.site_settings (
  id   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key  text UNIQUE NOT NULL,
  value text,
  updated_at timestamptz DEFAULT now()
);

-- Default values
INSERT INTO public.site_settings (key, value) VALUES
  ('logo_url',         '/logo.jpeg'),
  ('hero_title',       'UEEMT-TOKAT'),
  ('hero_subtitle',    'Union des Élèves et Étudiants Maliens à Tokat'),
  ('hero_tagline',     'Travail – Solidarité – Réussite'),
  ('hero_photo_urls',  '[]')
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read site_settings"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admin write site_settings"
  ON public.site_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
