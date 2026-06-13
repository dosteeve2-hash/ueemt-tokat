/**
 * Upload photos → Supabase Storage + seed DB
 *
 * USAGE:
 *   1. Récupère ta Service Role Key sur :
 *      Supabase Dashboard → Project Settings → API → service_role (secret)
 *   2. Ajoute-la dans .env.local :
 *      SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
 *   3. Exécute :
 *      node --env-file=.env.local scripts/upload-photos.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import path from 'path'

const SUPABASE_URL = 'https://ybjrmvvkasohslgsrhzh.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('❌  SUPABASE_SERVICE_ROLE_KEY manquant.')
  console.error('    Ajoute-la dans .env.local, puis relance:')
  console.error('    node --env-file=.env.local scripts/upload-photos.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Cherche un fichier dans les deux chemins possibles selon la session Claude
const UPLOAD_DIRS = [
  'C:\\Users\\pc\\AppData\\Roaming\\Claude\\local-agent-mode-sessions\\d65d992b-ca9b-4a05-8088-d3796ab721cc\\ec7ef6a0-607f-4594-adff-e7d31676b9f2\\agent\\local_ditto_ec7ef6a0-607f-4594-adff-e7d31676b9f2\\uploads',
]

function findFile(filename) {
  for (const dir of UPLOAD_DIRS) {
    const p = path.join(dir, filename)
    if (existsSync(p)) return p
  }
  return null
}

// IDs exacts de la DB (vérifiés via SELECT)
const ALBUMS = {
  ERASMUS:    '9ea42f31-0c08-41a8-ab05-f5b82692bea2',
  PICNIC:     '04ec15c9-00e4-4f2a-9ffa-4436caa59b84',
  RUPTURE:    '97d941d2-3cfa-48c1-86cb-aed898d57f7a',
  CINEMA:     '83fcff4d-10b6-4637-995b-990ce59b5eab',
  VIE_TOKAT:  '8a3247f9-0b5d-4180-b3f1-3fe534b9d65b',
}

const PHOTOS = [
  { file: 'f72e37b1-erasmus_4.jpeg',              albumId: ALBUMS.ERASMUS,   caption: 'Événement Erasmus à Tokat' },
  { file: '616cbfce-erasmus_2.jpeg',              albumId: ALBUMS.ERASMUS,   caption: 'Erasmus — rencontre internationale' },
  { file: 'fb14d37a-erasmus_3.jpeg',              albumId: ALBUMS.ERASMUS,   caption: "Stand Mali à l'Erasmus" },
  { file: 'd8a8ca00-erasmus.jpeg',                albumId: ALBUMS.ERASMUS,   caption: 'Journée Erasmus Tokat Gaziosmanpaşa' },
  { file: '8d33dcff-picnic_rupture_collective.jpeg', albumId: ALBUMS.PICNIC, caption: 'Pique-nique rupture collective' },
  { file: '4eab1803-reunion_association.jpeg',    albumId: ALBUMS.RUPTURE,   caption: "Réunion de l'association" },
  { file: '0badf443-reunion.jpeg',               albumId: ALBUMS.RUPTURE,   caption: 'Réunion des membres UEEMT' },
  { file: 'b31ca7f2-soiree_cine.jpeg',           albumId: ALBUMS.CINEMA,    caption: 'Soirée cinéma' },
  { file: 'e7e1f721-seance_avec_le_spycho.jpeg', albumId: ALBUMS.VIE_TOKAT, caption: 'Séance avec le psychologue' },
  { file: '2015fddd-lyceens.jpeg',               albumId: ALBUMS.VIE_TOKAT, caption: 'Lycéens maliens de Tokat' },
  { file: '650f4aeb-visite_aux_lyceens.jpeg',    albumId: ALBUMS.VIE_TOKAT, caption: 'Visite aux lycéens' },
  { file: '1cba83bf-fete_des_senegalais.jpeg',   albumId: ALBUMS.VIE_TOKAT, caption: 'Fête des Sénégalais — solidarité africaine' },
  { file: 'e40b7a60-jeux_entres_membres.jpeg',   albumId: ALBUMS.VIE_TOKAT, caption: 'Jeux entre membres' },
]

const coverMap = {}

for (const photo of PHOTOS) {
  const filePath = findFile(photo.file)
  if (!filePath) {
    console.warn(`⚠️  Fichier introuvable: ${photo.file}`)
    continue
  }

  const buffer = readFileSync(filePath)
  const storagePath = `albums/${photo.albumId}/${photo.file}`

  const { error: upErr } = await supabase.storage
    .from('photos')
    .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true })

  if (upErr) {
    console.error(`❌  Upload échoué (${photo.file}): ${upErr.message}`)
    continue
  }

  const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(storagePath)

  const { error: dbErr } = await supabase.from('photos').insert({
    album_id: photo.albumId,
    url: publicUrl,
    caption: photo.caption,
  })

  if (dbErr) {
    console.error(`❌  DB insert échoué (${photo.file}): ${dbErr.message}`)
  } else {
    console.log(`✅  ${photo.file}`)
    if (!coverMap[photo.albumId]) coverMap[photo.albumId] = publicUrl
  }
}

// Mise à jour des covers albums
console.log('\n📸  Covers albums...')
for (const [albumId, coverUrl] of Object.entries(coverMap)) {
  const { error } = await supabase
    .from('albums')
    .update({ cover_url: coverUrl })
    .eq('id', albumId)
  if (error) console.error(`❌  Cover update: ${error.message}`)
  else console.log(`✅  Cover → ${albumId}`)
}

// hero_photo_urls : 4 photos Erasmus + picnic + réunion pour le slideshow
const heroUrls = PHOTOS
  .filter(p =>
    p.albumId === ALBUMS.ERASMUS ||
    p.file.includes('picnic') ||
    p.file.includes('reunion_association')
  )
  .map(p => `${SUPABASE_URL}/storage/v1/object/public/photos/albums/${p.albumId}/${p.file}`)
  .slice(0, 6)

const { error: heroErr } = await supabase
  .from('site_settings')
  .upsert({ key: 'hero_photo_urls', value: JSON.stringify(heroUrls) }, { onConflict: 'key' })

if (heroErr) console.error('❌  hero_photo_urls:', heroErr.message)
else console.log(`\n🎉  Slideshow hero configuré avec ${heroUrls.length} photo(s)`)

console.log('\n✨  Terminé ! Rafraîchis le site pour voir les photos.')
