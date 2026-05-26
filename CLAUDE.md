# Claude Project Memory

## Project
- **Name**: SaaS Booking
- **Mission**: Plateforme B2B de coordination entre référents famille (centres sociaux) et prestataires externes (animateurs, psychologues, éducateurs, sportifs) pour la planification et le suivi d'ateliers multi-séances
- **Type**: Code (repo git)
- **Market V1**: Centres sociaux en Guadeloupe (1 à 5 pilotes)
- **Market V2**: Expansion territoires français
- **Funding V1**: FSE + subventions associatives
- **Timeline V1**: 6 mois
- **Dev**: Solo (Audrey)
- **Coexiste avec**: CAP et Passerelle CAP (produits tiers gérant les familles)

---

## Stack (figée — non négociable jusqu'à V1 livrée)

| Brique | Choix |
|---|---|
| Framework | Next.js 15 App Router + TypeScript (full-stack, pas de backend séparé) |
| DB | Neon Postgres (plan Launch ~5 $/mois) |
| ORM | Drizzle ORM + drizzle-kit |
| Auth | Better Auth (magic link uniquement en V1) |
| UI | shadcn/ui + Tailwind CSS |
| Forms / Validation | React Hook Form + Zod |
| Email | Resend |
| Monitoring | Sentry |
| Hosting | Render Web Service |
| Storage (si besoin) | Cloudflare R2 |

**Coût mensuel V1 estimé : 12 à 17 $/mois**

---

## Architecture

### Structure de projet

/app                          → Routes Next.js, UI uniquement, JAMAIS de SQL ici
/(admin)                    → Espace super_admin et project_admin
/(app)                      → Espace référent
/(pro)                      → Espace prestataire
/api/auth/[...all]          → Better Auth handler
/server                       → Toute la logique métier
/db
/schema                   → Schémas Drizzle modularisés par domaine
/client.ts                → Client Drizzle + Neon
/migrations               → Fichiers SQL générés par drizzle-kit
/auth/config.ts             → Configuration Better Auth
/context/server-context.ts  → ServerContext { user_id, centre_id, role }
/services                   → Logique métier (usage progressif)
/repositories               → Accès DB avec filtre centre_id systématique
/lib                        → email, errors, utils
/scripts
/migrate.ts                 → Application des migrations (séparé du build)
/seed.ts                    → Seed dev

### Rôles (4 fixes)
- `super_admin` : voit tout, bypasse le filtre centre_id
- `project_admin` : admin d'un centre
- `referent` : référent famille
- `provider` : prestataire externe

### Multi-tenant (isolation applicative)
- Champ `centre_id` sur TOUTES les tables métier
- Fonction unique `applyCenterScope(ctx, query)` gère le bypass `super_admin`
- `ServerContext` centralisé, jamais de `centre_id` venant du client
- Index sur `centre_id` partout (critique perfs)
- **Pas de RLS Postgres en V1** (V2 si besoin)

### Modèle de données (hiérarchie)
Centre → Project → Workshop → Session → Occurrence → Ticket → TicketSlot

Tables principales :
- `user` (Better Auth) étendu avec `centre_id`, `role`
- `session`, `account`, `verification` (Better Auth)
- `centre` (tenant)
- `project`
- `workshop_type` (référentiel 11 types fixes)
- `workshop`
- `provider_role` (pivot rôles requis par workshop_type)
- `provider`
- `provider_assignment` (junction provider/project, soft-deletable)
- `session_group`
- `occurrence`
- `ticket`
- `ticket_slot`
- `audit_log` (structure créée vide en V1, écritures V1.5)

### Règles techniques
- `id` : `uuid` natif Postgres (`gen_random_uuid()`)
- Timestamps : `TIMESTAMPTZ`, stockés UTC, affichés timezone du centre (défaut `America/Guadeloupe`)
- Soft delete via `deleted_at` (nullable timestamptz) sur toutes tables métier
- Pas de cascade delete

### Auth
- V1 : magic link uniquement (zéro gestion mot de passe oublié)
- Sessions stockées en DB (table `session` Better Auth)
- Hook `signIn` : refuser si `user.deleted_at IS NOT NULL`
- Page login unique `/login`, dispatch selon rôle :
  - super_admin / project_admin → `/admin`
  - referent → `/app`
  - provider → `/pro`

### Migrations
- `drizzle-kit generate` en local → fichiers SQL commitées dans `/server/db/migrations`
- Application via `npm run db:migrate` (script séparé)
- **Build Render** : `npm ci && npm run build` UNIQUEMENT (jamais de migration dans le build)
- Migrations prod : terminal local pointé sur DB prod, ou Render Job dédié

---

## Discipline V1 — règles d'or

### Appliquer immédiatement
1. Migrations séparées du build Render
2. ServerContext centralisé `{ user_id, centre_id, role }`
3. Structure stricte `/app` (UI) vs `/server` (logique)
4. Sentry pour visibilité erreurs prod
5. Table `audit_log` créée vide (écritures activées V1.5)
6. Dossier `/server/services/` créé (usage progressif)

### Interdit en V1 (sur-ingénierie)
- RLS Postgres (isolation applicative suffit)
- Jobs async / Inngest / BullMQ (synchrone OK)
- Permissions granulaires (4 rôles fixes suffisent)
- Rate limiting custom (celui de Better Auth suffit)
- TanStack Query au démarrage (server components Next.js d'abord)
- Tests unitaires (V1.5 sur services critiques)
- Storybook, monorepo, Turborepo
- Backend séparé (Fastify, Express)
- Observabilité business avancée

### Critère de bascule V1 → V1.5
Quand le 3ème centre social utilisateur est onboardé en prod, alors activer :
- Écritures dans `audit_log` aux points critiques
- Pattern service complet (route → service → repository)
- Monitoring approfondi (slow queries, DB connections)
- Tests unitaires sur services critiques
- Éventuellement password en plus du magic link

**Pas avant. Aucune négociation.**

---

## Stack rejetée et pourquoi (pour ne pas y revenir)

- **Supabase** : abandonné, plan Pro à 25 $/mois trop coûteux pour V1 financé par subvention
- **Prisma** : remplacé par Drizzle (meilleur alignement Neon, pas de génération de client)
- **Fastify backend séparé** : fusionné dans Next.js full-stack
- **Vercel** : remplacé par Render (serveur long-running, pas de complexité serverless)
- **Auth custom JWT** : remplacé par Better Auth (sécurité plug-and-play)
- **Express** : remplacé par Next.js (server actions + route handlers)

---

## Domain terminology (à respecter strictement dans le code)

| FR (métier) | EN (code) |
|---|---|
| Centre social | centre |
| Atelier | workshop |
| Séance | occurrence |
| Session de groupe | session_group |
| Référent famille | referent |
| Prestataire | provider |
| Créneau d'intervention | ticket_slot |
| Fiche navette | (concept CAP, hors scope SaaS) |
| Passerelle CAP | (concept CAP, hors scope SaaS) |

---

## Variables d'environnement

---

## TODO avant déploiement

Warnings non bloquants identifiés lors du build du 2026-05-26 — à corriger avant mise en prod Render :

1. **ESLint cassé** — `@eslint/eslintrc` introuvable dans `eslint.config.mjs`. Le lint est sauté silencieusement à chaque build.
2. **BETTER_AUTH_SECRET trop court** — clé dans `.env.local` insuffisante (< 32 chars). Générer avec `openssl rand -base64 32` et mettre à jour `.env.local` + variables Render.
3. **Next.js workspace root ambigu** — `package-lock.json` détecté à `/Users/audrey/` perturbe la détection de racine. Corriger via `outputFileTracingRoot` dans `next.config.ts` ou supprimer le lockfile parasite.

---

## Memory Infrastructure

Le dossier `.claude/memory/` contient 5 registres pour suivre l'état du projet.

**Au début de chaque session :**
1. Lire les 5 registres pour comprendre l'état actuel
2. Capitaliser les nouvelles informations dans les registres appropriés en fin de session

**Règles de capitalisation par registre :**

| Registre | Quand ajouter |
|----------|---------------|
| `decisions.md` | Choix techniques/architecturaux, trade-offs |
| `learnings.md` | Patterns découverts, bugs résolus, anti-patterns |
| `blockers.md` | Problèmes bloquants, dépendances externes |
| `journal.md` | Entrée par session, 3-5 lignes, résumé du travail fait |
| `evals.md` | Revues de code, tests utilisateurs, feedback produit |

**Format des entrées :**
- Schema YAML respecté en haut de chaque registre
- ID unique : `BDR-XXX` (decisions), `LRN-XXX` (learnings), `BLK-XXX` (blockers), `EVAL-XXX` (evals)
- Date format : `YYYY-MM-DD`
- Table d'index mise à jour après chaque ajout

---

## Development Rules

- Créer branche `feature/` avant de coder
- Jamais de push direct sur `main`
- Jamais de commit de `.env` ou secrets (`.env` dans `.gitignore` dès le jour 1)
- Validation Zod + error handling sur chaque route API / server action
- Migrations DB réversibles
- MVP first, optimiser plus tard
- Lovable mockups = référence visuelle uniquement, code from scratch
- Soft delete partout, jamais de DELETE physique en V1

---

## Règle de gouvernance Claude Code

Si Claude Code propose un changement de stack, un ajout d'outil hors stack figée, ou de la sur-ingénierie :
> **Réponse type** : "Suis le CLAUDE.md, n'en dévie pas."

Le rôle d'Audrey n'est pas de coder, c'est de maintenir la cohérence et le focus du projet. Claude Code exécute, Audrey décide.

**Interdiction d'affirmer sans preuve** : Claude Code ne doit jamais affirmer qu'une chose fonctionne, existe, ou est correcte sans l'avoir vérifié (lecture de fichier, exécution de commande, output réel). Toute affirmation invérifiable doit être formulée comme hypothèse explicite ("probablement", "à vérifier"). Si build, test ou lecture de fichier est impossible dans le contexte, le dire clairement plutôt que supposer.

**Règle git / .gitignore** : Avant tout `git add` ou `git init`, vérifier que `.gitignore` contient les entrées suivantes. Claude Code ne lance jamais de `git add` sans que ces exclusions soient en place :
```
.claude/worktrees/
.claude/memory/
.claude/settings.local.json
```
Ces dossiers sont internes à Claude Code et ne doivent jamais être commités. Une action à la fois : proposer le `.gitignore` → attendre confirmation → puis `git add`.

---

## Profil dev (Audrey)

- Décide rapidement face à des options structurées avec trade-offs clairs
- Préfère itérer sur les specs avant de coder
- Vision produit forte, drive vers les outcomes fonctionnels
- **Risque identifié** : tendance au pivot de stack en cas de friction → s'y opposer fermement
- Expérience préalable : autre SaaS en prod sur Neon + Render (~7 $/mois)
- Transition Replit → Claude Code en cours, courbe d'apprentissage normale

## Discipline de livraison

Avant chaque livraison à Audrey :

1. Lance `npx tsc --noEmit` et `npm run build`. Reporte le résultat ✅/❌.
   Si ❌, colle la sortie brute des erreurs.

2. Liste les décisions que tu as prises sans me demander
   (ou écris "aucune").

3. Aucune action irréversible (`db:push`, déploiement, suppression)
   tant que le build n'est pas vert ET que je n'ai pas donné mon GO.

4. Une seule prochaine action proposée à la fois.
<!-- # Claude Project Memory

## Project
- **Name**: SaaS Booking
- **Mission**: Enable social centers to schedule workshops with external service providers

- **Type**: Code (repo git)

## Stack
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS + Radix UI
- Backend: Node.js + Express.js + TypeScript
- DB: PostgreSQL on Neon (free tier) + Drizzle ORM
- Auth: Passport.js + JWT + bcrypt
- Deploy: Render

---

## Memory Infrastructure

Le dossier `.claude/memory/` contient 5 registres standards de la mémoire agent.

**Au début de chaque session :**
1. Lire les 5 registres pour comprendre l'état du projet
2. Capitaliser les nouvelles informations dans les registres appropriés

**Règles de capitalisation par type :**

| Registre | Quand ajouter |
|----------|---------------|
| `decisions.md` | Choix techniques/architecturaux, trade-offs, changements de stack |
| `learnings.md` | Patterns découverts, bugs résolus, anti-patterns identifiés |
| `blockers.md` | Problèmes bloquants, dépendances externes, friction majeure |
| `journal.md` | Entrée par session, 3-5 lignes max, résumé du travail fait |
| `evals.md` | Revues de code, tests utilisateurs, feedback produit |

**Format des entrées :**
- Toujours respecter le schema YAML en haut de chaque registre
- Assigner un ID unique : `BDR-XXX` (decisions), `LRN-XXX` (learnings), `BLK-XXX` (blockers), `EVAL-XXX` (evals)
- Date format : `YYYY-MM-DD`
- Mettre à jour la table d'index après chaque ajout

# Memory Rules

Read first:
- ./memory/architecture
- ./memory/adr
- ./memory/standards

Never read archived sessions unless explicitly requested.
Prefer ADRs over raw notes.

---

## Development Rules
- Créer branche `feature/` avant coder
- Jamais push sur `main` sans review
- Jamais commit de `.env` ou secrets
- Input validation (Zod) + error handling sur chaque route API
- Migrations DB réversibles
- MVP first, optimiser plus tard
- Lovable mockups = prototype, recoder proprement -->
