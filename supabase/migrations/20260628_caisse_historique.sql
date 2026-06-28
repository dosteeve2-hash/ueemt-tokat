-- Migration : table caisse_historique
-- Applique dans le dashboard Supabase > SQL Editor
-- Ou via : supabase db push (si CLI configuré)

create table if not exists caisse_historique (
  id             uuid primary key default gen_random_uuid(),
  type           text not null check (type in ('entree', 'sortie', 'update')),
  montant        numeric not null,
  member_id      uuid references members(id) on delete set null,
  month          date,
  notes          text,
  enregistre_par uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);

-- Index pour les requêtes par date
create index if not exists caisse_historique_created_at_idx
  on caisse_historique (created_at desc);

-- RLS
alter table caisse_historique enable row level security;

-- Lecture : gestionnaires seulement
create policy "gestionnaires_can_read_caisse_historique"
  on caisse_historique for select
  to authenticated
  using (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid()
        and up.role in ('admin', 'president', 'tresorier', 'adjoint_tresorier', 'caissier')
    )
  );

-- Insertion : gestionnaires seulement
create policy "gestionnaires_can_insert_caisse_historique"
  on caisse_historique for insert
  to authenticated
  with check (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid()
        and up.role in ('admin', 'president', 'tresorier', 'adjoint_tresorier', 'caissier')
    )
  );
