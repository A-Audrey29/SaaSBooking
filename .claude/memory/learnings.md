# Learnings Registry

Schema:
- ID: Unique identifier (LRN-XXX)
- Date: YYYY-MM-DD
- Pattern: What was observed
- Context: When/where it happened
- Apply: How to use this insight

---

## Index

| ID | Date | Domaine | Pattern |
|----|------|---------|---------|
| LRN-012 | 2026-06-09 | Migrations | Migration manuelle ignorée par le migrator Drizzle |
| LRN-001 | 2026-05-20 | Migrations | Migration path inconsistency config vs spec |
| LRN-002 | 2026-05-20 | Scaffold | Scaffold initial non testé = code cassé |
| LRN-003 | 2026-05-20 | Business | Provider/compétences simplifié V1 (matching manuel) |
| LRN-004 | 2026-05-20 | Scaffold | Package manager version non fixée |
| LRN-005 | 2026-05-20 | Scaffold | Checklist 5 commandes obligatoires avant "terminé" |
| LRN-006 | 2026-05-20 | Build | Dépendances natives → cycle install+build immédiat |
| LRN-007 | 2026-05-21 | DB/Neon | drizzle-kit migrate instable WebSocket local |
| LRN-008 | 2026-05-21 | DB/prod | Production Neon non tracée (voir BLK-007) |
| LRN-009 | 2026-05-21 | DB/Neon | Neon branches forkent état parent |
| LRN-010 | 2026-05-21 | Config | dotenv ne charge pas .env.local par défaut |
| LRN-011 | 2026-05-21 | DB/Drizzle | Table tracking dans schéma drizzle (pas public) |

---

## Entries

### LRN-001: Migration output path — config vs spec divergent
- **Date**: 2026-05-20
- **Pattern**: `drizzle.config.ts` output pointe sur `./public/migrations`, CLAUDE.md spec dit `/server/db/migrations`. Les deux divergent — scripts/migrate.ts suit le config (./public/migrations).
- **Context**: Audit initial du projet — aucune migration générée, path jamais tranché.
- **Apply**: Avant de générer la première migration, confirmer le path avec Audrey et aligner drizzle.config.ts + CLAUDE.md + scripts/migrate.ts sur la même valeur.

### LRN-003 — Modèle provider/compétences en V1 délibérément simplifié
- **Date**: 2026-05-20
- **Pattern**: Aucune table ne lie un provider à un type d'atelier en V1. Matching provider↔workshop manuel via `providerAssignment.role` (text libre). Champ `specialites` supprimé du seed — pas d'équivalent en base.
- **Context**: 2 providers, 3 ateliers en V1 → matching manuel viable. Table `provider_workshop_type` jugée sur-ingénierie à ce stade.
- **Apply**: En V2+, ajouter table `provider_workshop_type` (compétences) ou FK `providerAssignment.role → providerRole.id` quand volume le justifie. Ne pas anticiper en V1.

### LRN-007 — drizzle-kit migrate instable avec Neon WebSocket en local
- **Date**: 2026-05-21
- **Pattern**: `drizzle-kit migrate` exécute partiellement le DDL (16 CREATE TABLE OK) puis hang avant les `ALTER TABLE` FK. Résultat observé : 14 FK sur 16 appliquées, table `__drizzle_migrations` jamais créée.
- **Context**: Cause probable — timeout WebSocket dans l'env local (firewall, proxy, ou comportement intrinsèque du driver `@neondatabase/serverless` ws mode).
- **Apply**: Utiliser `tsx scripts/migrate.ts` (driver HTTP `drizzle-orm/neon-http/migrator`) comme commande `db:migrate` par défaut. Ne jamais utiliser `drizzle-kit migrate` directement sur Neon — le driver HTTP exécute via REST API et est stable.
- **Implémentation**: package.json modifié. `db:migrate` pointe sur `tsx scripts/migrate.ts` (driver HTTP via drizzle-orm/neon-http).

### LRN-006 — Dépendances natives : cycle install+build immédiat après scaffold
- **Date**: 2026-05-20
- **Pattern**: Tout scaffold incluant des dépendances natives (esbuild, sharp, Sentry, etc.) doit être suivi immédiatement de `pnpm install` + `pnpm run build`. Sans ça, les défauts d'installation/configuration restent invisibles — découverts seulement lors du premier vrai build, potentiellement des heures de travail plus tard.
- **Context**: Cas rencontré sur ce projet — dépendances natives présentes dans `package.json` sans validation post-scaffold.
- **Apply**: Dès qu'une dépendance native apparaît dans `package.json`, exécuter le cycle complet avant de continuer. Ne pas supposer que `pnpm install` seul suffit — le build doit passer vert.

### LRN-005 — Checklist scaffold : 5 commandes obligatoires avant livraison
- **Date**: 2026-05-20
- **Pattern**: Scaffold non validé = scaffold non terminé. Les 5 commandes doivent passer en vert dans l'ordre :
  1. `pnpm install` — cohérence des dépendances
  2. `npx tsc --noEmit` — types valides
  3. `pnpm run build` — build prod réussi
  4. `pnpm run db:generate` + relecture SQL — schéma cohérent
  5. `pnpm tsx scripts/seed.ts` sur DB de test — seed fonctionnel
- **Context**: LRN-002 et LRN-004 révèlent que Claude Code annonce "terminé" sans avoir exécuté ces vérifications.
- **Apply**: Ne jamais annoncer "scaffold terminé" sans avoir exécuté ces 5 commandes et reporté le résultat ✅/❌. Si un contexte empêche l'exécution, le dire explicitement — jamais supposer que ça passe.

### LRN-004 — Scaffold ne fixe pas la version du package manager
- **Date**: 2026-05-20
- **Pattern**: Scaffold Claude Code ne définit pas `packageManager` dans `package.json`. Corepack peut alors tenter une mise à jour majeure imprévue (ex. npm/pnpm/yarn) au premier `install`.
- **Context**: Découvert lors de setup projet — champ absent, version flottante.
- **Apply**: Au scaffold, vérifier la présence de `"packageManager": "npm@x.y.z"` (ou pnpm/yarn selon stack) dans `package.json`. Ajouter manuellement si absent.

### LRN-002 — Scaffold initial Claude Code livre du code non testé
- **Date**: 2026-05-20
- **Pattern**: Scaffold annoncé "terminé" contient des défauts détectables immédiatement : tsconfig incomplet, `schema/index.ts` manquant, 2 imports relatifs cassés, callback Better Auth non typé.
- **Context**: Découverte en BLK-001 lors de l'audit initial — aucun `tsc --noEmit` lancé au scaffold.
- **Apply**: Ne jamais faire confiance à un scaffold non testé. Exiger `tsc --noEmit` + `npm run build` verts avant toute action irréversible, même si Claude Code annonce "scaffold terminé".

### LRN-008: Production Neon dans un état non tracé au démarrage de session
- **Date**: 2026-05-21
- **Pattern**: branche production avait 16 tables + 14 FK + données + pas de __drizzle_migrations au démarrage de la session
- **Context**: Hypothèse — drizzle-kit push exécuté à une date indéterminée (Claude Code ou scaffold initial)
- **Apply**: JAMAIS utiliser `db:push` ou `drizzle-kit push`. TOUJOURS `db:migrate` avec tracking. À ajouter dans CLAUDE.md comme règle de gouvernance.

### LRN-009: Neon branches forkent l'état parent
- **Date**: 2026-05-21
- **Pattern**: une nouvelle branche Neon hérite des tables/données de la branche parente. Si parent est dans un état incohérent, drop + recreate de la branche ne nettoie pas.
- **Context**: Testé en tentant de recréer une branche propre depuis une branche avec tables erronées.
- **Apply**: drop manuel des tables sur la nouvelle branche, OU partir d'une branche propre comme source. Convention adoptée : pour le DROP, toujours utiliser un garde-fou explicite dans le script Node (vérifier l'endpoint URL avant d'exécuter).

### LRN-010: dotenv ne charge pas .env.local par défaut
- **Date**: 2026-05-21
- **Pattern**: `import "dotenv/config"` lit `.env` seulement. Next.js convention = `.env.local` prioritaire.
- **Context**: Drizzle config ne trouvait pas les variables de dev.
- **Apply**: utiliser `config({ path: ".env.local" })` puis `config()` en fallback. Appliqué à `drizzle.config.ts` et `scripts/migrate.ts`.

### LRN-012: Migration manuelle ignorée par le migrator Drizzle
- **Date**: 2026-06-09
- **Pattern**: Un fichier SQL créé manuellement dans `server/db/migrations/` + entrée ajoutée dans `_journal.json` n'est PAS appliqué par `tsx scripts/migrate.ts`. Le migrator `drizzle-orm/neon-serverless/migrator` hash le contenu SQL et compare avec `drizzle.__drizzle_migrations` — mais il ne pickup pas les fichiers sans snapshot correspondant dans `meta/`.
- **Context**: Migration `0014_occurrence_nullable_dates.sql` écrite à la main (ALTER TABLE DROP NOT NULL). `npm run db:migrate` retournait "✓ Migrations completed" sans l'appliquer. Colonnes restaient NOT NULL en DB.
- **Apply**: Pour toute migration manuelle (DDL simple, ALTER, DROP CONSTRAINT…) — ne pas passer par le migrator Drizzle. Appliquer directement via un script `tsx` avec `neon()` HTTP driver. Exemple : `await sql\`ALTER TABLE occurrence ALTER COLUMN start_at DROP NOT NULL\``. Supprimer le script après usage. Le fichier `.sql` reste dans le dossier pour traçabilité git.

### LRN-011: Table de tracking Drizzle vit dans le schéma `drizzle`
- **Date**: 2026-05-21
- **Pattern**: Table `__drizzle_migrations` créée dans le schéma `drizzle`, pas `public`.
- **Context**: Vérification sur la DB Neon dev après migration 0000.
- **Apply**: scripts de vérification doivent qualifier le schéma : `drizzle.__drizzle_migrations`.

