/**
 * Upload des photos réelles vers Supabase Storage + seed DB
 * Usage: $env:SUPABASE_SERVICE_ROLE_KEY="<key>"; node scripts/upload-photos.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'

const SUPABASE_URL = 'https://ybjrmvvkasohslgsrhzh.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquant.')
  console.error('   Lance: $env:SUPABASE_SERVICE_ROLE_KEY="<ta_clé>" ; node scripts/upload-photos.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

const S1 = 'C:\\Users\\pc\\AppData\\Roaming\\Claude\\local-agent-mode-sessions\\d65d992b-ca9b-4a05-8088-d3796ab721cc\\ec7ef6a0-607f-4594-adff-e7d31676b9f2\\agent\\local_ditto_ec7ef6a0-607f-4594-adff-e7d31676b9f2\\uploads'
const S2 = 'C:\\Users\\pc\\AppData\\Roaming\\Claude\\local-agent-mode-sessions\\d65d992b-ca9b-4a09-b9a2-a4190e87c4ce\\ec7ef6a0-607f-4594-adff-e7d31676b9f2\\agent\\local_ditto_ec7ef6a0-607f-4594-adff-e7d31676b9f2\\uploads'

const PHOTOS = [
  { dir: S1, file: '2015fddd-lyceens.jpeg',                     album: 'Lycéens',              caption: 'Lycéens maliens à Tokat' },
  { dir: S1, file: '650f4aeb-visite_aux_lyceens.jpeg',          album: 'Lycéens',              caption: 'Visite aux lycéens' },
  { dir: S1, file: '8d33dcff-picnic_rupture_collective.jpeg',   album: 'Vie sociale',          caption: 'Pique-nique rupture collective' },
  { dir: S1, file: '4eab1803-reunion_association.jpeg',         album: 'Réunions',             caption: "Réunion de l'association" },
  { dir: S1, file: '0badf443-reunion.jpeg',                     album: 'Réunions',             caption: 'Réunion UEEMT' },
  { dir: S1, file: 'e7e1f721-seance_avec_le_spycho.jpeg',       album: 'Activités culturelles',caption: 'Séance avec le psychologue' },
  { dir: S1, file: 'b31ca7f2-soiree_cine.jpeg',                 album: 'Activités culturelles',caption: 'Soirée cinéma' },
  { dir: S2, file: 'd8a8ca00-erasmus.jpeg',                     album: 'Erasmus',              caption: 'Erasmus à Tokat' },
  { dir: S2, file: '616cbfce-erasmus_2.jpeg',                   album: 'Erasmus',              caption: 'Erasmus - activité 2' },
  { dir: S2, file: 'fb14d37a-erasmus_3.jpeg',                   album: 'Erasmus',              caption: 'Erasmus - activité 3' },
  { dir: S2, file: 'f72e37b1-erasmus_4.jpeg',                   album: 'Erasmus',              caption: 'Erasmus - activité 4' },
  { dir: S2, file: '1cba83bf-fete_des_senegalais.jpeg',         album: 'Fêtes et célébrations',caption: 'Fête des Sénégalais' },
  { dir: S2, file: 'e40b7a60-jeux_entres_membres.jpeg',         album: 'Vie sociale',          caption: 'Jeux entre membres' },
]

async function main() {
  console.log('🔄 Récupération des albums en base...')
  const { data: albums, error: albumsError } = await supabase.from('albums').select('id, titre')
  if (albumsError) {
    console.error('❌ Erreur albums:', albumsError.message)
    process.exit(1)
  }

  const albumMap = {}
  for (const a of albums) albumMap[a.titre] = a.id
  console.log('Albums trouvés:', Object.keys(albumMap).join(', ') || '(aucun)')

  if (Object.keys(albumMap).length === 0) {
    console.error('❌ Aucun album en base. Lance le seed SQL d\'abord.')
    process.exit(1)
  }

  const coverMap = {}

  for (const photo of PHOTOS) {
    const albumId = albumMap[photo.album]
    if (!albumId) {
      console.warn(`⚠️  Album "${photo.album}" introuvable — skip ${photo.file}`)
      continue
    }

    const filePath = `${photo.dir}\\${photo.file}`
    if (!existsSync(filePath)) {
      console.warn(`⚠️  Fichier absent: ${filePath}`)
      continue
    }

    const buffer = readFileSync(filePath)
    const cleanName = photo.file.replace(/^[0-9a-f]+-/, '')
    const storagePath = `${albumId}/${Date.now()}_${cleanName}`

    const { error: upErr } = await supabase.storage
      .from('photos')
      .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true })

    if (upErr) {
      console.error(`❌ Upload échoué (${photo.file}): ${upErr.message}`)
      continue
    }

    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(storagePath)
    const url = urlData.publicUrl

    const { error: dbErr } = await supabase.from('photos').insert({
      album_id: albumId,
      url,
      caption: photo.caption,
    })

    if (dbErr) {
      console.error(`❌ DB insert échoué (${photo.file}): ${dbErr.message}`)
    } else {
      console.log(`✅ ${photo.file} → "${photo.album}"`)
      if (!coverMap[albumId]) coverMap[albumId] = url
    }
  }

  console.log('\n🖼️  Mise à jour des covers albums...')
  for (const [albumId, coverUrl] of Object.entries(coverMap)) {
    const { error } = await supabase.from('albums').update({ cover_url: coverUrl }).eq('id', albumId)
    if (error) console.error(`❌ Cover update échoué: ${error.message}`)
    else console.log(`✅ Cover définie pour album ${albumId}`)
  }

  console.log('\n🎉 Upload terminé !')
}

main().catch(console.error)
