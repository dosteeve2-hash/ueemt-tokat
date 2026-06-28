# ╔══════════════════════════════════════════════════════════════╗
# ║  UEEMT-Tokat — Build + Git + PR                             ║
# ║  Lance depuis le dossier ueemt-tokat :                      ║
# ║    .\run-deploy.ps1                                         ║
# ╚══════════════════════════════════════════════════════════════╝

$ErrorActionPreference = "Stop"
$BRANCH = "feat/stele-fondateurs-caisse"
$REPO   = "dosteeve2-hash/ueemt-tokat"

Write-Host "`n📁 Dossier : $PWD" -ForegroundColor Cyan

# 1. Créer / basculer sur la branche
Write-Host "`n🌿 Création de la branche $BRANCH..." -ForegroundColor Yellow
git checkout -b $BRANCH 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Branche existante – on la réutilise." -ForegroundColor Gray
    git checkout $BRANCH
}

# 2. Build
Write-Host "`n🔨 npm run build..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build échoué ! Corrections nécessaires avant de pusher." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build OK" -ForegroundColor Green

# 3. Stage + Commit
Write-Host "`n📦 Commit..." -ForegroundColor Yellow
git add -A
git status --short

git commit -m "feat: stele fondateurs, fix caisse automatique, fix Steeve

- Tâche 1 : Page /fondateurs — Stèle des Fondateurs (Zack, Mansa, Idy)
  avec design gold/dark, photo Zack depuis /presidents/zakaria-bengaly.jpeg,
  upload photo via file picker vers Supabase Storage (bucket avatars),
  URLs sauvegardées dans site_settings, lien ajouté dans la Navbar.

- Tâche 2 : Fix cotisations → caisse automatique
  marquerPaye() incrémente caisse.montant dès qu'un paiement est validé.
  annulerPaiement() décrémente caisse.montant lors d'une annulation.
  Nouveau type CaisseHistoriqueItem + getCaisseHistorique() server action.
  Historique caisse affiché sur la page cotisations pour les gestionnaires.
  Migration SQL : supabase/migrations/20260628_caisse_historique.sql

- Tâche 3 : Correction du prénom Steve → Steeve partout
  (CLAUDE.md, README.md, src/app/api/pwa-icon/route.ts)

Co-authored-by: Claude <claude@anthropic.com>"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Commit échoué." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Commit OK" -ForegroundColor Green

# 4. Push
Write-Host "`n🚀 Push vers origin/$BRANCH..." -ForegroundColor Yellow
git push -u origin $BRANCH
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push échoué." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Push OK" -ForegroundColor Green

# 5. PR via GitHub CLI (si gh est installé)
if (Get-Command gh -ErrorAction SilentlyContinue) {
    Write-Host "`n🔗 Création de la PR via gh CLI..." -ForegroundColor Yellow
    gh pr create `
        --repo $REPO `
        --base main `
        --head $BRANCH `
        --title "feat: Stèle des Fondateurs + fix caisse + fix Steeve" `
        --body "## Résumé des changements

### ✨ Tâche 1 — Page Stèle des Fondateurs (\`/fondateurs\`)
- Nouvelle page dédiée avec design honorifique gold/dark
- Card fondateur (Zack) avec sa photo \`/presidents/zakaria-bengaly.jpeg\`
- Cards Mansa & Idy avec placeholder + bouton upload photo (Supabase Storage)
- URLs stockées dans \`site_settings\` (clés \`founder_photo_mansa\`, \`founder_photo_idy\`)
- Lien **Fondateurs** ajouté dans la Navbar (sidebar mobile + desktop)

### 🐛 Tâche 2 — Fix cotisations → caisse automatique
- \`marquerPaye()\` : incrémente \`caisse.montant\` à chaque paiement validé
- \`annulerPaiement()\` : décrémente \`caisse.montant\` à chaque annulation
- Nouveau type \`CaisseHistoriqueItem\` + action \`getCaisseHistorique()\`
- Historique de la caisse affiché sur \`/cotisations\` (section gestionnaire)
- Migration SQL : \`supabase/migrations/20260628_caisse_historique.sql\`

### 🔤 Tâche 3 — Fix prénom Steeve
- Toutes les occurrences \`Steve\` → \`Steeve\` dans les fichiers du projet

Co-authored-by: Claude <claude@anthropic.com>"

    Write-Host "`n🔀 Merge de la PR..." -ForegroundColor Yellow
    gh pr merge --repo $REPO --squash --auto
    Write-Host "✅ PR créée et mergée !" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  GitHub CLI (gh) non trouvé." -ForegroundColor Yellow
    Write-Host "   → Ouvre cette URL pour créer la PR manuellement :" -ForegroundColor Gray
    Write-Host "   https://github.com/$REPO/compare/main...$BRANCH" -ForegroundColor Cyan
}

Write-Host "`n✅ Tout est terminé ! Vérifie GitHub : https://github.com/$REPO" -ForegroundColor Green
