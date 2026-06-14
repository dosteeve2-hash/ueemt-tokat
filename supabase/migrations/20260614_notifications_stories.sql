-- ============================================================
-- Migration : notifications + stories
-- Date : 2026-06-14
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- ─── NOTIFICATIONS ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         REFERENCES user_profiles(id) ON DELETE CASCADE,
  type       TEXT         NOT NULL,
  actor_id   UUID         REFERENCES user_profiles(id) ON DELETE SET NULL,
  post_id    UUID         REFERENCES posts(id) ON DELETE CASCADE,
  read       BOOLEAN      DEFAULT false,
  created_at TIMESTAMPTZ  DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifs_own" ON notifications;
CREATE POLICY "notifs_own" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_unread_idx  ON notifications(user_id, read) WHERE read = false;

-- ─── STORIES ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stories (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id  UUID         REFERENCES user_profiles(id) ON DELETE CASCADE,
  image_url  TEXT,
  text       TEXT,
  bg_color   TEXT         DEFAULT '#0F1C3F',
  text_color TEXT         DEFAULT '#FFFFFF',
  expires_at TIMESTAMPTZ  DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ  DEFAULT now()
);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stories_read"         ON stories;
DROP POLICY IF EXISTS "stories_admin_write"  ON stories;
DROP POLICY IF EXISTS "stories_admin_delete" ON stories;

CREATE POLICY "stories_read" ON stories
  FOR SELECT USING (expires_at > now() AND auth.uid() IS NOT NULL);

CREATE POLICY "stories_admin_write" ON stories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "stories_admin_delete" ON stories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index pour les stories actives
CREATE INDEX IF NOT EXISTS stories_active_idx ON stories(expires_at DESC) WHERE expires_at > now();
