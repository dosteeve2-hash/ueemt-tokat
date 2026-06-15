-- Migration V3 — events + post_comments
-- Run this in Supabase Dashboard > SQL Editor

-- ============ HELPER FUNCTION ============
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============ EVENTS TABLE ============
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  image_url TEXT,
  is_published BOOLEAN DEFAULT true,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_public_read" ON events
  FOR SELECT USING (is_published = true OR auth.uid() IS NOT NULL);

CREATE POLICY "events_admin_write" ON events
  FOR ALL USING (public.is_admin());

-- ============ POST COMMENTS TABLE ============
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_read" ON post_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "comments_insert" ON post_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "comments_delete" ON post_comments
  FOR DELETE USING (auth.uid() = author_id OR public.is_admin());
