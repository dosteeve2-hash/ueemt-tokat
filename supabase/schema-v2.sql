-- V2 Schema additions for UEEMT-Tokat
-- Run this AFTER schema.sql (V1)

-- User profiles (links auth.users to members)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  member_id UUID REFERENCES members(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'guest')),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Albums
CREATE TABLE IF NOT EXISTS albums (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  titre TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos (in albums)
CREATE TABLE IF NOT EXISTS photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Private documents per user
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities (created by admins)
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  titre TEXT NOT NULL,
  description TEXT,
  date DATE,
  instagram_url TEXT,
  cover_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ RLS POLICIES ============

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- user_profiles: each user sees only their own, admins see all
CREATE POLICY "Users read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin'
  ));
CREATE POLICY "Users insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- albums: public read, admins write
CREATE POLICY "Public read albums" ON albums FOR SELECT USING (is_public = true OR auth.role() = 'authenticated');
CREATE POLICY "Admins insert albums" ON albums FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins update albums" ON albums FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- photos: public read, members insert their own
CREATE POLICY "Public read photos" ON photos FOR SELECT USING (true);
CREATE POLICY "Members insert photos" ON photos FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Users delete own photos" ON photos FOR DELETE USING (auth.uid() = uploaded_by);

-- documents: strictly private per user
CREATE POLICY "Users read own documents" ON documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own documents" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own documents" ON documents FOR DELETE USING (auth.uid() = user_id);

-- activities: public read, admins write
CREATE POLICY "Public read activities" ON activities FOR SELECT USING (true);
CREATE POLICY "Admins manage activities" ON activities FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============ STORAGE BUCKETS ============
-- Run these manually in Supabase Storage UI or via API:
-- 1. Create bucket 'avatars' (public: true)
-- 2. Create bucket 'photos' (public: true)
-- 3. Create bucket 'documents' (public: false)

-- ============ SEED ALBUMS ============
-- Run after creating the auth user for admin:
-- INSERT INTO albums (titre, description, is_public) VALUES
-- ('Erasmus Tokat', 'Nos aventures Erasmus', true),
-- ('Pique-nique & Sorties', 'Sorties en plein air à Tokat', true),
-- ('Soirée Cinéma', 'Soirées cinéma entre membres', true),
-- ('Rupture Collective', 'La rupture collective du Ramadan', true),
-- ('Tournoi d''Échecs', 'Tournoi d''échecs chez les Samaké', true),
-- ('Vie à Tokat', 'La vie quotidienne à Tokat', true);
