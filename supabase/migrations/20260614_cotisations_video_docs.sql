-- ============================================================
-- Migration : cotisations + video/doc support in posts
-- Date : 2026-06-14
-- À exécuter dans Supabase Dashboard > SQL Editor
-- ============================================================

-- ─── 1. NOUVEAUX RÔLES ───────────────────────────────────────
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('admin', 'member', 'tresorier', 'adjoint_tresorier'));

-- ─── 2. TABLE COTISATION_PAYMENTS ────────────────────────────
CREATE TABLE IF NOT EXISTS cotisation_payments (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID         NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount      DECIMAL(10,2) NOT NULL,
  month       DATE         NOT NULL, -- ex: 2026-06-01 (premier du mois)
  paid_at     TIMESTAMPTZ  DEFAULT NOW(),
  validated_by UUID        REFERENCES auth.users(id),
  notes       TEXT,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(member_id, month)
);

-- ─── 3. TABLE CAISSE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS caisse (
  id                   INT          PRIMARY KEY DEFAULT 1,
  montant              DECIMAL(10,2) NOT NULL DEFAULT 0,
  cotisation_mensuelle DECIMAL(10,2) NOT NULL DEFAULT 2000,
  updated_at           TIMESTAMPTZ  DEFAULT NOW(),
  updated_by           UUID         REFERENCES auth.users(id)
);
INSERT INTO caisse (id, montant, cotisation_mensuelle)
VALUES (1, 0, 2000) ON CONFLICT DO NOTHING;

-- ─── 4. RLS COTISATION_PAYMENTS ──────────────────────────────
ALTER TABLE cotisation_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cotisations_select" ON cotisation_payments;
CREATE POLICY "cotisations_select" ON cotisation_payments
  FOR SELECT USING (
    -- Admin/trésorier voient tout
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.role IN ('admin', 'tresorier', 'adjoint_tresorier')
    )
    OR
    -- Membres voient uniquement leur propre cotisation
    member_id IN (
      SELECT m.id FROM members m
      JOIN user_profiles up ON up.member_id = m.id
      WHERE up.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "cotisations_write" ON cotisation_payments;
CREATE POLICY "cotisations_write" ON cotisation_payments
  FOR ALL USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('tresorier', 'adjoint_tresorier')
    )
  )
  WITH CHECK (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('tresorier', 'adjoint_tresorier')
    )
  );

-- ─── 5. RLS CAISSE ───────────────────────────────────────────
ALTER TABLE caisse ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "caisse_read_all" ON caisse;
CREATE POLICY "caisse_read_all" ON caisse
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "caisse_write" ON caisse;
CREATE POLICY "caisse_write" ON caisse
  FOR UPDATE USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('tresorier', 'adjoint_tresorier')
    )
  ) WITH CHECK (true);

-- ─── 6. INDEX ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cotisation_payments_member
  ON cotisation_payments(member_id);
CREATE INDEX IF NOT EXISTS idx_cotisation_payments_month
  ON cotisation_payments(month DESC);

-- ─── 7. COLONNES DOCUMENTS DANS POSTS ────────────────────────
ALTER TABLE posts ADD COLUMN IF NOT EXISTS document_url  TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS document_name TEXT;

-- ─── 8. BUCKET STORAGE DOCUMENTS ─────────────────────────────
-- À faire manuellement dans Supabase Dashboard > Storage :
-- Créer un bucket public nommé "documents" avec les policies suivantes :
--
-- Policy SELECT (public read) :
--   USING (true)
--
-- Policy INSERT (membres authentifiés) :
--   WITH CHECK (auth.uid() IS NOT NULL)
--
-- Policy DELETE (propriétaire uniquement) :
--   USING ((storage.foldername(name))[1] = auth.uid()::text)
