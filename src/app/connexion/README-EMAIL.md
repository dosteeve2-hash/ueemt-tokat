# Email magic link — Guide de configuration pour 34 membres

## Situation actuelle

| Méthode | Statut | Limite |
|---------|--------|--------|
| Resend API (sandbox) | ⚠️ Fonctionne uniquement vers l'email du compte owner | 100 emails/jour max |
| Supabase signInWithOtp | ✅ Fonctionne pour tous | ~4 emails/heure au TOTAL |

**Problème** : Avec 34 membres qui se connectent quasi simultanément, le fallback Supabase va bloquer après 4 emails.

---

## Solution rapide (15 min) — Activer un domaine Resend

### 1. Ajouter un domaine dans Resend

1. Aller sur [resend.com/domains](https://resend.com/domains)
2. Cliquer "Add Domain"
3. Entrer ton domaine (ex: `ueemt-tokat.vercel.app` — ou mieux, un vrai domaine custom)
4. Ajouter les enregistrements DNS indiqués (SPF, DKIM, DMARC)
5. Vérifier le domaine (DNS se propage en 5-30 min)

### 2. Changer le `from` dans le code

Dans `src/app/connexion/actions.ts`, ligne `from`:
```
// Avant (sandbox) :
from: 'UEEMT-Tokat <onboarding@resend.dev>',

// Après (domaine vérifié) :
from: 'UEEMT-Tokat <noreply@ton-domaine.com>',
```

### 3. Vérifier les variables Vercel

Dans le dashboard Vercel → Settings → Environment Variables :
```
RESEND_API_KEY         = re_xxxxx (ta clé Resend)
SUPABASE_SERVICE_ROLE_KEY = eyJ... (doit commencer par eyJ)
NEXT_PUBLIC_SITE_URL   = https://ueemt-tokat.vercel.app
```

---

## Solution alternative — SMTP Supabase personnalisé

Si tu n'as pas de domaine propre à vérifier, configure le SMTP de Resend dans Supabase :

1. Aller dans [Supabase Dashboard](https://app.supabase.com) → Auth → SMTP Settings
2. Activer "Custom SMTP"
3. Remplir avec les infos SMTP de Resend :
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: ta clé Resend (`re_xxx`)
   - From: `onboarding@resend.dev` (ou ton domaine si vérifié)
4. Sauvegarder

Avec cette config, **tous les emails passent par Resend** (même le fallback signInWithOtp), donc la rate limit Supabase est contournée.

---

## Avant la session avec 34 membres — checklist

- [ ] Domaine Resend vérifié OU SMTP Supabase configuré
- [ ] Test envoi vers un email non-owner (Gmail, etc.)
- [ ] Vérifier que le lien magic link redirige bien vers `/auth/callback`
- [ ] Avoir 2-3 membres tester 30 min avant l'event pour valider le flux complet

---

*Dernière mise à jour : 2026-06-14*
