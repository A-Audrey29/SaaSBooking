# Blockers Registry

Schema:
- ID: Unique identifier (BLK-XXX)
- Date: YYYY-MM-DD
- Friction: What's blocking progress
- Root Cause: Why it's happening
- Solution: How to fix it
- Status: open | resolved | workaround

---

## Index

| ID | Status | Domaine | Résumé |
|----|--------|---------|--------|
| BLK-001 | ✓ resolved | DB/migrations | Migrations SQL non générées |
| BLK-002 | ✓ resolved | Auth | Login email+password au lieu magic link |
| BLK-003 | open | Build/ESLint | @eslint/eslintrc manquant |
| BLK-004 | open | DB/Neon | fetchConnectionCache déprécié |
| BLK-005 | open | Auth/secrets | BETTER_AUTH_SECRET trop court |
| BLK-006 | open | Deploy/Render | Env vars à configurer |
| BLK-007 | open | DB/prod | Production Neon non tracée |
| BLK-008 | open | Build/Next | /404 : Html importé hors _document |
| BLK-009 | ✓ resolved | Auth | Chaîne 5 bugs auth — magic link 500 |
| BLK-010 | open | Build/Tailwind | tailwind.config.ts require() dans ESM |
| BLK-011 | open | Security/prod | dev-login route dans le build |

---

## Entries

### BLK-001: Migrations SQL non générées — DB non initialisable
- **Date**: 2026-05-20
- **Friction**: `drizzle-kit generate` jamais lancé → dossier `./public/migrations/` vide → impossible d'initialiser la DB → impossible de tester quoi que ce soit
- **Root Cause**: Projet en phase scaffold, aucune session de dev active avant audit du 2026-05-20
- **Solution**: 1) Trancher le path migrations (voir LRN-001), 2) `npm run db:generate`, 3) commit les fichiers SQL, 4) `npm run db:migrate` pointé sur la DB Neon
- **Resolved**: 2026-05-21 — Build vert (EXIT_CODE=0). Path corrigé `./public/migrations` → `./server/db/migrations`. tsc 0 erreur. Migration 0000_chunky_randall.sql appliquée proprement sur branche Neon dev. 16 tables, 16 FK, types TIMESTAMPTZ, tracking __drizzle_migrations en place.
- **Status**: resolved
- **Voir**: LRN-003 et LRN-007 pour les leçons opérationnelles.

### BLK-002: Login page utilise email+password (spec dit magic link uniquement)
- **Date**: 2026-05-20
- **Friction**: [app/login/page.tsx](app/login/page.tsx) implémente un form email+password. Better Auth config a le plugin Resend commenté. Le flow magic link n'est pas câblé.
- **Root Cause**: Form temporaire pour dev local, jamais converti
- **Solution**: Réécrire login page avec form email seul → appel `authClient.signIn.magicLink()`. Transport = console.log en dev (pas Resend).
- **Resolved**: 2026-06-03 — Login page réduite à champ email seul. Magic link fonctionnel en dev via console.log.
- **Status**: resolved

### BLK-003: ESLint — @eslint/eslintrc package manquant
- **Date**: 2026-05-21
- **Friction**: `eslint.config.mjs` référence `@eslint/eslintrc` non installé. Loggé ⨯ pendant `next build` mais EXIT_CODE=0 (non bloquant).
- **Root Cause**: Package absent de devDependencies.
- **Solution**: `pnpm add -D @eslint/eslintrc` — ou corriger l'import dans `eslint.config.mjs` selon flat config ESLint.
- **Status**: open

### BLK-004: Neon — fetchConnectionCache option dépréciée
- **Date**: 2026-05-21
- **Friction**: Warning à chaque build : `'fetchConnectionCache' option is deprecated (now always 'true')`.
- **Root Cause**: Option supprimée dans @neondatabase/serverless récent — valeur `true` implicite désormais.
- **Solution**: Supprimer `neonConfig.fetchConnectionCache = true` dans [server/db/client.ts](server/db/client.ts).
- **Status**: open

### BLK-005: Better Auth — BETTER_AUTH_SECRET trop court
- **Date**: 2026-05-21
- **Friction**: Warning : `BETTER_AUTH_SECRET should be at least 32 characters long`. Non bloquant dev, bloquant prod.
- **Root Cause**: Secret trop court dans `.env.local`.
- **Solution**: `openssl rand -base64 32` → mettre à jour `.env.local` + variable Render.
- **Status**: open

### BLK-006: Variables d'environnement Render à configurer
- **Date**: 2026-05-21
- **Friction**: Premier build Render échouera si env vars non définies (DB url, secrets, etc.)
- **Root Cause**: Aucun déploiement Render configuré à ce jour
- **Solution**: Avant premier push sur branch Render → configurer toutes les env vars dans dashboard Render
- **Status**: open

### BLK-008: Build rouge — /404 : Html importé hors _document
- **Date**: 2026-06-03
- **Friction**: `next build` rouge sur /404 — composant `Html` importé en dehors de `_document`.
- **Root Cause**: À diagnostiquer.
- **Solution**: Identifier le fichier incriminé, corriger l'import.
- **Status**: open
- **Priorité**: HAUTE — bloque déploiement prod

### BLK-009: Chaîne 5 bugs auth — magic link 500
- **Date**: 2026-06-03
- **Friction**: Page magic link callback crashait en 500. Chaîne de 5 bugs liés.
- **Root Cause (chaîne)**:
  1. `verification/session/account.id` : `uuid` → `text` (Better Auth attend text)
  2. `user.emailVerified` : `timestamp` → `boolean` (mismatch Better Auth qui envoie `true` booléen)
  3. Timestamps auth : `mode: "date"` requis sur toutes les colonnes timestamp
  4. `db client` : schéma passé à `drizzle()` pour activer les modes de colonnes
  5. `additionalFields` manquant dans auth config : `role` + `centreId` non exposés dans session
- **Solution appliquée**:
  - Migration 0007 : `ALTER TABLE "user" ALTER COLUMN "emailVerified" SET DATA TYPE boolean USING ...`
  - `server/auth/config.ts` : ajout `user.additionalFields` (role + centreId)
  - `server/db/schema/auth.ts` : emailVerified → boolean, timestamps → mode:"date"
- **Resolved**: 2026-06-03 — Magic link fonctionnel, /admin accessible.
- **Status**: resolved

### BLK-010: tailwind.config.ts — require() dans contexte ESM
- **Date**: 2026-06-03
- **Friction**: `ReferenceError` en dev — `tailwind.config.ts` utilise `require()` dans un module ESM.
- **Root Cause**: Config tailwind écrite en CommonJS syntax, projet en ESM.
- **Solution**: Convertir `require()` en `import` dans `tailwind.config.ts`.
- **Status**: open
- **Priorité**: BASSE — non bloquant dev

### BLK-011: dev-login route présente dans le build
- **Date**: 2026-06-03
- **Friction**: Route `/dev-login` détectée dans le build — ne doit pas exister en prod.
- **Root Cause**: Route de dev jamais supprimée.
- **Solution**: Supprimer le fichier de route avant déploiement prod.
- **Status**: open
- **Priorité**: HAUTE — sécurité prod (voir BDR-007)

### BLK-007: Production Neon dans un état non tracé
- **Date**: 2026-05-21
- **Friction**: branche production a 16 tables avec schéma incorrect (timestamp without time zone), 14 FK (manque 2), 3 users + 1 centre, pas de tracking __drizzle_migrations
- **Root Cause**: drizzle-kit push exécuté à une date indéterminée (Claude Code ou scaffold initial)
- **Solution envisagée**:
  1. Identifier l'origine des 3 users + 1 centre (test ou réel ?)
  2. Si jetable: DROP toutes les tables prod + db:migrate propre
  3. Si non jetable: ALTER TABLE pour passer timestamp → timestamptz + ajouter les 2 FK
- **Status**: open
- **Priorité**: MOYENNE — à traiter en session dédiée, à tête reposée
