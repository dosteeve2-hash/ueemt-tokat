// Simule 34 utilisateurs qui accèdent au site en même temps
// Usage : node scripts/load-test.mjs [URL]
const BASE_URL = process.argv[2] ?? 'https://ueemt-tokat.vercel.app'

const ENDPOINTS = ['/', '/membres', '/activites', '/feed', '/a-propos', '/connexion']

async function testConcurrent() {
  console.log(`\n🧪 Test de charge — 34 utilisateurs simultanés sur ${BASE_URL}\n`)

  const promises = Array.from({ length: 34 }, (_, i) => {
    const url = ENDPOINTS[i % ENDPOINTS.length]
    const start = Date.now()
    return fetch(`${BASE_URL}${url}`, {
      headers: { 'User-Agent': `UEEMT-LoadTest-User${i + 1}` },
      redirect: 'follow',
    })
      .then(r => ({ url, status: r.status, ok: r.ok, ms: Date.now() - start }))
      .catch(e => ({ url, status: 0, ok: false, error: e.message, ms: Date.now() - start }))
  })

  const results = await Promise.all(promises)

  const ok = results.filter(r => r.ok)
  const failed = results.filter(r => !r.ok)
  const avgMs = Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length)
  const maxMs = Math.max(...results.map(r => r.ms))

  console.log(`✅ ${ok.length}/34 requêtes OK`)
  console.log(`⏱  Temps moyen : ${avgMs}ms | Max : ${maxMs}ms\n`)

  if (failed.length > 0) {
    console.log('❌ Échecs :')
    failed.forEach(r => console.log(`   ${r.url} → ${r.status || r.error}`))
  } else {
    console.log('🎉 Aucun échec — le site supporte la charge !')
  }

  // Répartition par endpoint
  console.log('\n📊 Détail par endpoint :')
  for (const ep of ENDPOINTS) {
    const subset = results.filter(r => r.url === ep)
    const epOk = subset.filter(r => r.ok).length
    const epAvg = Math.round(subset.reduce((s, r) => s + r.ms, 0) / subset.length)
    console.log(`   ${ep.padEnd(15)} ${epOk}/${subset.length} OK  ~${epAvg}ms`)
  }
  console.log()
}

testConcurrent()
