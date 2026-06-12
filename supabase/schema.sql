CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  email TEXT UNIQUE,
  telephone TEXT,
  photo_url TEXT,
  filiere TEXT,
  universite TEXT,
  niveau TEXT,
  statut TEXT DEFAULT 'Étudiant' CHECK (statut IN ('Étudiant', 'Élève lycée', 'Mezun')),
  num_etudiant TEXT,
  date_arrivee_tokat DATE,
  quartier_tokat TEXT,
  is_active BOOLEAN DEFAULT true,
  is_validated BOOLEAN DEFAULT false,
  cotisation_payee BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert members" ON members FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can read members" ON members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can update members" ON members FOR UPDATE USING (auth.jwt() ->> 'email' = 'docompaore2@gmail.com');
CREATE POLICY "Anyone can insert contacts" ON contacts FOR INSERT WITH CHECK (true);
