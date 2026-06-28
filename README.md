<div align="center">

# 🦁 UEEMT-TOKAT

### *Union des Élèves et Étudiants Maliens à Tokat*
### *Travail – Solidarité – Réussite*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

**[🌐 Voir le site](https://ueemt-tokat.vercel.app)** · **[🐛 Signaler un bug](https://github.com/dosteeve2-hash/ueemt-tokat/issues)** · **[✨ Proposer une feature](https://github.com/dosteeve2-hash/ueemt-tokat/issues)**

</div>

---

## ✨ À propos

**UEEMT-Tokat** est la plateforme digitale officielle de l'Union des Élèves et Étudiants Maliens à Tokat, en Turquie. Fondée en 2022, l'association rassemble plus de 36 étudiants maliens partageant un idéal de travail, de solidarité et d'excellence académique.

Cette application web permet aux membres de rester connectés, de partager leurs actualités, d'accéder aux albums photos des événements, et de retrouver les informations clés de leur communauté — loin du Mali, mais jamais seuls.

---

## 🎯 Fonctionnalités

- ✅ **Authentification sécurisée** — Inscription + connexion via Supabase Auth, première connexion guidée
- ✅ **Fil d'actualités** — Posts textuels avec auteur, date relative, et fil de communauté
- ✅ **Galerie photos** — Albums d'événements avec lightbox et captions
- ✅ **Annuaire des membres** — Profils actifs avec avatars colorés et recherche
- ✅ **Bureau Exécutif** — Présentation dynamique des membres du bureau
- ✅ **Hero configurable** — Titre, sous-titre, tagline et photos modifiables via l'admin
- ✅ **Notifications push** — Web Push notifications pour les événements importants
- ✅ **Email transactionnel** — Envoi d'emails via Resend
- ✅ **Monitoring** — Intégration Sentry pour la détection d'erreurs en prod
- ✅ **PWA-ready** — Interface mobile-first, responsive sur tous les écrans
- 🚧 **Espace documents** — Accès aux ressources partagées (en cours)
- 🚧 **Événements & calendrier** — Agenda communautaire (planifié)

---

## 🛠️ Stack technique

| Technologie | Rôle |
|-------------|------|
| [Next.js 16](https://nextjs.org/) App Router | Framework frontend |
| [TypeScript 5](https://www.typescriptlang.org/) | Typage strict |
| [Supabase](https://supabase.com/) | PostgreSQL + Auth + Storage |
| [Tailwind CSS v4](https://tailwindcss.com/) | Styles |
| [Resend](https://resend.com/) | Emails transactionnels |
| [Web Push](https://www.npmjs.com/package/web-push) | Notifications push |
| [Sentry](https://sentry.io/) | Monitoring & error tracking |
| [Vitest](https://vitest.dev/) | Tests unitaires |
| [Vercel](https://vercel.com/) | Déploiement |

---

## 🚀 Installation locale

### Prérequis
- Node.js 18+
- Un projet Supabase
- Un compte Resend (pour les emails)

### Étapes

```bash
# 1. Cloner le projet
git clone https://github.com/dosteeve2-hash/ueemt-tokat.git
cd ueemt-tokat

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
```

Renseigner dans `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
RESEND_API_KEY=re_votre-clé
NEXT_PUBLIC_VAPID_PUBLIC_KEY=votre-clé-vapid-publique
VAPID_PRIVATE_KEY=votre-clé-vapid-privée
```

```bash
# 4. Lancer en développement
npm run dev
# → http://localhost:3000

# 5. Lancer les tests
npm run test
```

---

## 🗄️ Architecture base de données

Tables Supabase avec Row Level Security (RLS) :

```
members          → Profils des membres (prenom, nom, filière, statut)
user_profiles    → Liaison auth.users ↔ members
posts            → Publications du fil d'actualité
photos           → Albums photos des événements
site_settings    → Configuration dynamique du hero
push_subscriptions → Abonnements aux notifications push
```

---

## 📅 Roadmap

### ✅ Phase 1 — Lancement (Fait)
- [x] Authentification + première connexion guidée
- [x] Fil d'actualités communautaire
- [x] Galerie photos par événement
- [x] Annuaire des membres
- [x] Bureau Exécutif & valeurs
- [x] Notifications push
- [x] Monitoring Sentry

### 🔧 Phase 2 — Engagement (Q3 2026)
- [ ] Likes et commentaires sur les posts
- [ ] Système d'événements avec RSVP
- [ ] Messagerie directe entre membres
- [ ] Partage d'albums photos en interne

### 🚀 Phase 3 — Services (Q4 2026)
- [ ] Espace documents (guides étudiant, documents officiels)
- [ ] Forum thématique (logement, études, vie pratique)
- [ ] Application mobile (React Native)
- [ ] Intégration WhatsApp pour annonces

---

## 🔒 Sécurité

- **RLS Supabase** sur toutes les tables
- **`getUser()`** (jamais `getSession()`) dans les Server Components
- Variables d'environnement jamais commitées (`.env*` dans `.gitignore`)
- TypeScript strict — 0 `any`

---

## 🤝 Contribuer

Ce projet est open-source et les contributions sont bienvenues !

1. Forkez le repo
2. Créez votre branche (`git checkout -b feature/ma-feature`)
3. Committez vos changements (`git commit -m 'feat: description'`)
4. Poussez sur votre branche
5. Ouvrez une Pull Request

---

## 📄 Licence

MIT © 2026 [Steeve Donald Compaoré](https://github.com/dosteeve2-hash)

---

<div align="center">

**Si ce projet vous inspire, laissez une ⭐ — ça compte énormément !**

*Fait avec ❤️ pour la communauté malienne de Tokat, depuis Istanbul*

</div>
