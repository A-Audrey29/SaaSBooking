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
| BLK-002 | open | Auth | Login email+password au lieu magic link |
| BLK-003 | open | Build/ESLint | @eslint/eslintrc manquant |
| BLK-004 | open | DB/Neon | fetchConnectionCache déprécié |
| BLK-005 | open | Auth/secrets | BETTER_AUTH_SECRET trop court |
| BLK-006 | open | Deploy/Render | Env vars à configurer |
| BLK-007 | open | DB/prod | Production Neon non tracée |

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
- **Solution**: Réécrire login page avec form email seul → appel `authClient.signIn.magicLink()`. Décommenter plugin Resend dans [server/auth/config.ts](server/auth/config.ts).
- **Status**: open

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
