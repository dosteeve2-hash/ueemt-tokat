# CLAUDE.md — UEEMT-Tokat

Projet : site web de l'Union des Élèves et Étudiants Maliens à Tokat (Turquie).

Stack : Next.js 16 App Router · TypeScript strict · Tailwind CSS · Supabase (Auth + DB + Storage) · Vercel

---

## Architecture

```
src/app/              — Pages (App Router)
  (auth)/             — Layout sans Navbar (connexion, recensement)
  auth/callback/      — Échange PKCE code → session
  dashboard/          — Espace membre (tabs : profil, docs, photos)
  dashboard/admin/    — Admin (validation membres, contenu)
  feed/               — Fil d'actualité (posts + likes)
  membres/            — Grille des membres publics
  membres/[id]/       — Profil public d'un membre
  profil/             — Édition de son propre profil
  activites/          — Albums photos
  activites/[id]/     — Détail album + lightbox

src/components/       — Composants réutilisables
  Navbar.tsx          — Nav responsive (liens conditionnels selon auth)
  HeroSlideshow.tsx   — Carousel hero avec fallback gradient
  FeedClient.tsx      — Feed avec optimistic UI
  MembresClient.tsx   — Grille membres
  ProfilClient.tsx    — Edit profil avec upload avatar
  dashboard/          — Tabs du dashboard
  activites/          — AlbumGrid, AlbumDetailClient (lightbox)

src/lib/supabase/     — Clients Supabase (server.ts, client.ts)
src/lib/constants.ts  — BUREAU_MEMBERS, constantes globales
```

## Tables Supabase clés

- `members` — recensement (prenom, nom, filiere, is_validated)
- `user_profiles` — profil social (avatar_url, bio, quote, is_public, role)
- `feed_posts` — posts du fil d'actu (is_pinned pour annonces bureau)
- `feed_likes` — likes par user
- `albums` + `album_photos` — galerie photos
- `documents` — documents membres
- `site_settings` — config hero (key/value)

RLS activé sur toutes les tables. `WITH CHECK` obligatoire sur INSERT/UPDATE.

## Auth

Email + password via `signInWithPassword`. Magic link réservé comme fallback admin.
Reset mot de passe : `resetPasswordForEmail` → `/definir-mot-de-passe`.
Callback : `/auth/callback/route.ts` — gère les deux formats :
- `?code=` → `exchangeCodeForSession(code)` (PKCE)
- `?token_hash=&type=` → `verifyOtp(...)` (OTP)

Email custom via Resend + Admin API (`generateLink` ne déclenche pas l'email Supabase).
Fallback : `signInWithOtp` si `SUPABASE_SERVICE_ROLE_KEY` absent/invalide.

## Variables d'environnement requises

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY      # JWT commençant par eyJ
RESEND_API_KEY                 # Pour emails custom
NEXT_PUBLIC_SITE_URL           # https://ueemt-tokat.vercel.app
```

---

## Règle UX permanente — ZÉRO EMPTY STATES

**Jamais d'état vide sans CTA engageant.** Toute section sans contenu doit proposer une action.

### Pattern obligatoire

```tsx
{items.length === 0 ? (
  <div className="rounded-2xl border p-16 text-center">
    <div className="text-5xl mb-4">🎯</div>
    <h3 className="text-xl font-bold mb-2">Titre accrocheur</h3>
    <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
      Description courte + invitation à agir.
    </p>
    <Link href="/action" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold">
      Action principale
    </Link>
  </div>
) : (
  // contenu normal
)}
```

### Implémentations existantes

| Page / composant | État vide → CTA |
|---|---|
| `/feed` (FeedClient) | 📸 "Sois le premier à partager !" → focus textarea |
| `/membres` (MembresClient) | 🌍 "La famille arrive bientôt !" → Se recenser |
| Album sans photos (AlbumDetailClient) | 📷 "Cet album attend vos souvenirs" → /dashboard |
| Dashboard (DashboardClient) | Checklist onboarding si pas de bio ou avatar |
| Profil sans bio (ProfilClient) | Bannière amber d'invitation à compléter |
| Page d'accueil (page.tsx) | CTA conditionnel : "Se recenser" (visiteur) ou "Fil d'actu + Activités" (connecté) |

### Règle de contenu

- Emoji grande taille (text-4xl ou text-5xl) — donne de la vie
- Titre en `font-bold` ou `font-black`
- Description courte en `text-gray-500 text-sm`
- CTA en `rounded-full` avec couleur green-600 (primaire) ou amber (second)
- Jamais d'icône grise seule + texte plat

---

## Charte visuelle (ueemt-tokat)

- Couleur primaire : `green-600` (#14A44D)
- Background pages : `bg-gray-50` / cartes : `bg-white`
- Radius : `rounded-xl` (16px) ou `rounded-2xl` (20px)
- Typographie : Tailwind defaults (pas de Playfair ici — association malienne, style clean)
- Badges statuts : `bg-green-100 text-green-700` (admin/validé), `bg-gray-100 text-gray-500` (membre standard)

---

## Sécurité

- Headers HTTP configurés dans `next.config.ts` : X-Frame-Options, CSP, nosniff, Referrer-Policy
- `poweredByHeader: false`
- RLS strict sur toutes les tables avec `WITH CHECK`
- Storage avatars : ownership enforced via `(auth.uid())::text = (storage.foldername(name))[1]`
- Validation Zod côté serveur sur toutes les Server Actions
- `stripBom` sur toutes les env vars lues (Windows PowerShell injecte U+FEFF)

---

## Multi-langue (FR / EN / TR)

- Context : `src/contexts/LanguageContext.tsx` — `useLanguage()` hook, persisté en `localStorage`
- Messages : `src/i18n/messages/{fr,en,tr}.json`
- Sélecteur dans Navbar (desktop + mobile)
- Pour traduire un composant : `const { t } = useLanguage()` + `t('section.key')`

## Publication App Store (future)

Pour publier sur App Store sans Mac :
- Option 1 : Capacitor (capacitorjs.com) — wrap le Next.js en app native, build via Xcode Cloud (cloud, pas besoin de Mac local)
- Option 2 : EAS Build (Expo) — build iOS dans le cloud
- Prérequis : compte Apple Developer (99$/an), enregistrement Bundle ID
- L'app PWA actuelle peut déjà être "installée" depuis Safari sans App Store

---

## Workflow pré-PR obligatoire

Avant tout PR ou mise en production :
1. `npm run build` — 0 erreur TypeScript
2. `npm audit` — corriger toutes les vulnérabilités high/critical
3. CodeRabbit review — le bot commente automatiquement sur chaque PR GitHub
   - Pour déclencher manuellement : commenter `@coderabbitai review` sur le PR
   - Pour un résumé : `@coderabbitai summary`
   - Pour corriger un problème signalé : `@coderabbitai fix <description>`
4. Résoudre TOUS les commentaires CodeRabbit marqués "Must Fix" avant merge

## Installation CodeRabbit (une fois)
1. Aller sur https://app.coderabbit.ai
2. "Install on GitHub" → sélectionner le repo ueemt-tokat
3. Gratuit pour les repos publics/open source

---

## Sécurité & Production

### Règles absolues (toujours appliquer)
- Utiliser `getUser()` jamais `getSession()` dans les Server Actions (getSession fait confiance au client)
- BOM strip sur tous les env vars : `.replace(/^﻿/, '')`
- Ne jamais retourner de messages d'erreur techniques au client — `console.error` côté serveur + message générique côté client
- Vérifier ownership/role côté serveur sur CHAQUE Server Action qui prend un ID en paramètre (IDOR)
- Rate limiting : par email ou identifiant métier, pas par IP (IP non fiable sur campus/NAT)
- Honeypot anti-bot : champ caché `aria-hidden` + `tabindex=-1`, styler avec `position:absolute; left:-9999px`

### Checklist déploiement production
- [ ] Toutes les mutations via Server Actions ('use server') → CSRF natif Next.js
- [ ] RLS activé sur toutes les tables Supabase
- [ ] SUPABASE_SERVICE_ROLE_KEY en variable Vercel chiffrée, jamais dans le code
- [ ] .env.local dans .gitignore
- [ ] Security headers dans next.config.ts (X-Frame-Options, CSP, nosniff, Referrer-Policy)
- [ ] Validation backend sur tous les inputs (ne pas faire confiance au frontend seul)
- [ ] Uploads : rejeter double-extensions (.php.jpg), re-encoder les images via canvas
- [ ] Approbation admin obligatoire avant accès pour les nouveaux membres
- [ ] npm audit après chaque ajout de dépendance

### Architecture Supabase + Next.js (ce qui marche bien)
- Server Components pour les pages protégées → redirect vers /connexion si non authentifié
- `createServerClient` (server), `createBrowserClient` (client) — ne jamais mélanger
- Fonctions SECURITY DEFINER `is_admin()` et `get_my_role()` pour les RLS policies
- Storage : bucket `photos` (images+vidéos, 50MB max), bucket `documents` (PDF/DOCX/etc, 10MB max)
- Auth email+password avec `signInWithPassword`, reset via `resetPasswordForEmail` → `/definir-mot-de-passe`

---

## Stratégie de déploiement

### Staging (avant mise en production)
- Chaque PR sur GitHub crée automatiquement une **Preview URL** sur Vercel
- Format : `https://ueemt-tokat-git-<branch>-<user>.vercel.app`
- **Toujours tester sur la preview** avant de merger sur main
- La preview utilise les variables d'environnement de production (configurable dans Vercel → Settings → Environment Variables → Preview)

### Rollback (si ça casse en prod)
1. Aller sur https://vercel.com → projet ueemt-tokat → onglet **Deployments**
2. Cliquer sur le déploiement précédent (en statut "Ready")
3. Cliquer sur les **trois points** → **"Promote to Production"**
4. Le rollback est instantané, 0 downtime

### Variables d'environnement à configurer dans Vercel
- `NEXT_PUBLIC_SUPABASE_URL` — public
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public
- `SUPABASE_SERVICE_ROLE_KEY` — serveur seulement, chiffré
- `NEXT_PUBLIC_SENTRY_DSN` — public (à ajouter après création compte Sentry)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — public
- `VAPID_PRIVATE_KEY` — serveur seulement
- `RESEND_API_KEY` — serveur seulement

### Monitoring
- **Sentry** : créer un compte sur https://sentry.io → nouveau projet Next.js → copier le DSN → l'ajouter dans Vercel en tant que `NEXT_PUBLIC_SENTRY_DSN`
- **UptimeRobot** : https://uptimerobot.com → moniteur HTTP sur https://ueemt-tokat.vercel.app → alerte email si down > 5 min

### Tests automatisés
- `npm test` — lance Vitest en mode CI (une seule passe)
- `npm run test:watch` — mode interactif en développement
- Tests dans `src/__tests__/` : `validation.test.ts`, `rate-limit.test.ts`
- Ajouter `npm test` dans le workflow CI avant chaque déploiement

---

*Maintenu par Steve Donald Compaoré — dernière mise à jour : 2026-06-14*
