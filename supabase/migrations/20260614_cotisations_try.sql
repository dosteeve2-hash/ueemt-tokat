-- ============================================================
-- Migration : Passer la caisse en ₺ TRY (Livre turque)
-- Date : 2026-06-14
-- À exécuter dans Supabase Dashboard > SQL Editor
-- ============================================================

-- ─── 1. Mettre à jour les valeurs par défaut de la caisse ──
-- cotisation mensuelle : 50 ₺
-- montant caisse initial : 1000 ₺

UPDATE caisse
SET
  cotisation_mensuelle = 50,
  montant              = 1000,
  updated_at           = NOW()
WHERE id = 1;

-- Changer les DEFAULT pour les futures insertions
ALTER TABLE caisse
  ALTER COLUMN cotisation_mensuelle SET DEFAULT 50;

ALTER TABLE caisse
  ALTER COLUMN montant SET DEFAULT 1000;

-- ─── 2. Changer le DEFAULT du montant dans cotisation_payments ──
ALTER TABLE cotisation_payments
  ALTER COLUMN amount SET DEFAULT 50;

-- ─── 3. Note ──────────────────────────────────────────────────
-- La devise n'est pas stockée en base mais affichée côté client.
-- Le symbole ₺ (Livre turque / TRY) est maintenant utilisé
-- dans toute l'interface à la place de FCFA.
