-- Storage RLS policies pour le bucket 'photos'
-- À exécuter dans Supabase SQL Editor

-- Lecture publique de toutes les photos
CREATE POLICY "Public photos read" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

-- Upload autorisé pour tous les membres connectés
CREATE POLICY "Authenticated upload photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'photos' AND auth.role() = 'authenticated'
  );

-- Suppression : admins seulement dans storage
-- (les membres suppriment uniquement la row DB via RLS photos table)
CREATE POLICY "Admins delete photos storage" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'photos' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy DELETE supplémentaire pour la table photos (admins)
CREATE POLICY "Admins delete any photo" ON photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
