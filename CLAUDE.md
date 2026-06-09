# SaaS Booking — Asanblé


## DEVISE
tu es un dev sénior tu fais du développement simple propre commenté robuste et safe t tu es exigent sur le fait de ne pas créer de dette ou de conflit dans le projet

## Mission
Plateforme B2B coordination centres sociaux ↔ prestataires pour ateliers multi-séances. V1 Guadeloupe, V2 France.

## Stack (verrouillée V1)
Next.js 15 App Router + TypeScript · Drizzle ORM · Neon Postgres · Better Auth (magic link only) · shadcn/ui + Tailwind · React Hook Form + Zod · Resend · Sentry · Render Web Service.
Coût cible : 12–17 $/mois.

## Règles critiques (non négociables V1)
- **Schéma = Drizzle TS source de vérité.** Toute migration SQL doit avoir son équivalent dans le schéma TS. Jamais l'un sans l'autre.
- **Migrations séparées du build Render** (`npm run db:migrate` ≠ build).
- **Migrations réversibles** : chaque `ADD CONSTRAINT` / `ALTER` a son `DROP` symétrique documenté dans le fichier de migration (commentaire `-- rollback:`).
- **ServerContext centralisé** `{ userId, centreId, role }`. Le `centreId` ne vient JAMAIS du client.
- **Structure stricte** : `/app` (UI) vs `/server` (logique métier). Aucun appel DB depuis `/app`.
- **4 rôles fixes** : `super_admin`, `project_admin`, `referent`, `provider`.
- **Soft delete partout** (`deleted_at`). Pas de DELETE physique en V1.
- **Pas de RLS Postgres en V1.** Isolation applicative par `centre_id` suffit.
- **Pas de psql direct depuis shell.** `DATABASE_URL` n'est jamais dans l'env shell (chargé par Next.js uniquement). Pour vérifier DB : script tsx avec dotenv chargeant `.env.local` explicitement.

## Interdits V1 (YAGNI)
RLS · jobs async · permissions granulaires · rate limiting custom · tests · monorepo · signup public (seed script à la place).

## Anti-invention (lecture obligatoire avant action)
Claude Code n'écrit rien sans preuve par lecture ou exécution. Concrètement :

1. **Avant de référencer un fichier**, le lire (`cat` / `view`) et coller la portion pertinente dans la réponse.
2. **Avant `ADD CONSTRAINT` (CHECK / UNIQUE / FK)**, exécuter une requête de vérification sur les données existantes et coller le résultat brut.
   - CHECK : `SELECT DISTINCT <col> FROM <table>;`
   - UNIQUE : `SELECT <cols>, COUNT(*) FROM <table> GROUP BY <cols> HAVING COUNT(*) > 1;`
   - FK : `SELECT COUNT(*) FROM <child> c LEFT JOIN <parent> p ON c.fk = p.id WHERE c.fk IS NOT NULL AND p.id IS NULL;`
3. **Avant d'écrire une migration**, vérifier le path réel via `drizzle.config.ts` et le coller.
4. **Avant d'affirmer qu'une table / colonne existe**, l'avoir vue dans le schéma TS ou via `\d` / `information_schema`.
5. **Si impossible de vérifier** → écrire littéralement `« Je ne sais pas, à vérifier »`. Jamais supposer.

## Spec fonctionnelle
**`docs/spec-v1.md`** — source de vérité fonctionnelle V1 (modèle données complet, rôles, flux, règles métier).
Lire avant tout ajout ou modification de feature, table, ou flux métier.

## Memory — consulter AVANT modifications
Fichiers dans `.claude/memory/` :

| Fichier | Contenu |
|---------|---------|
| `stack.md` | Stack détaillée, alternatives rejetées, interdits V1 |
| `architecture.md` | Structure projet, multi-tenant, modèle données, migrations |
| `terminology.md` | Domain FR ↔ EN (centre, workshop, occurrence…) |
| `environment.md` | Env vars + TODO deploy |
| `blockers.md` | BLK-001 à BLK-007 |
| `decisions.md` | BDR-001 à BDR-005 |
| `learnings.md` | LRN-001 à LRN-011 (migrations, drizzle-kit, Neon branches) |

**Lecture obligatoire avant toute modif sur** : migrations · auth flow · multi-tenant · workshop_type · schéma DB.

## graphify
Knowledge graph dans `graphify-out/`. Règles :
- Question sur le code → `graphify query "<question>"` en premier si `graphify-out/graph.json` existe.
- Relations → `graphify path "<A>" "<B>"`. Concept ciblé → `graphify explain "<concept>"`.
- Navigation large → `graphify-out/wiki/index.md`.
- `GRAPH_REPORT.md` uniquement pour revue d'architecture large.
- Après modif code → `graphify update .`.

## Conventions techniques
- UUID en clés primaires.
- `TIMESTAMPTZ` stocké UTC.
- `deleted_at` sur toutes les tables métier.
- Branche `feature/<nom>` avant coder. Jamais de push direct sur `main`.
- Validation Zod + error handling sur chaque route / server action.

## Discipline de livraison
Avant chaque livraison, Claude Code produit dans sa réponse, dans cet ordre :

1. **Output brut** de `npx tsc --noEmit` (pas de résumé, pas de ✅, le stdout complet).
2. **Output brut** de `npm run build`.
3. **Liste des fichiers créés / modifiés** dans la session (chemins exacts).
4. **Liste des décisions prises sans demander** (ou « aucune »).
5. **Une seule** prochaine action proposée. Pas de roadmap. Tu ne rédiges pas le contenu d'une action future, tu la nommes seulement. 

Aucune action irréversible (`db:push`, `db:migrate`, `DROP`, suppression fichier) sans build vert ET GO explicite d'Audrey dans le chat.

## Fin de session
- Lancer pnpm tsc --noEmit (vert obligatoire 


avant commit)
- Git commit avec message structuré
- Rappel manuel : /graphify update . à lancer dans le chat
  pour mettre à jour le knowledge graph

## Gouvernance
- Si proposition de changement de stack ou de sur-ingénierie → réponse standard : **« Suis le CLAUDE.md, n'en dévie pas. »**
- Si Claude Code propose une décision produit (UX, métier, périmètre) → s'arrêter et demander, ne pas trancher seul.
- Distinction toujours explicite : **fait vérifié** (avec preuve) vs **hypothèse** (étiquetée comme telle).

## Avant toute contrainte sur une colonne
Avant d'ajouter CHECK, UNIQUE ou FK sur une colonne :
1. Chercher toutes les tables qui stockent la même sémantique 
   (grep sur le nom de colonne dans /server/db/schema/)
2. Identifier la source de vérité : enum fixe code ou table référence ?
3. Si table référence existe → pas de CHECK fixe, analyser FK possible
4. Documenter le choix dans decisions.md avec la raison

