# Asanblé — Garde-fous Claude Code

> À fusionner avec le CLAUDE.md existant.
> Ces règles ne sont pas des recommandations. Ce sont des invariants
> bloquants. Toute violation = STOP immédiat et signalement à Audrey.

---

## Garde-fou 1 — Charger `.env.local` avant tout `psql`

Avant TOUTE commande `psql` ou requête DB en bash :

```bash
set -a; source .env.local; set +a
echo "URL active : $DATABASE_URL"
```

Puis vérifier :
- `DATABASE_URL` est non vide.
- `DATABASE_URL` contient `neon.tech`.

Si l'une des deux conditions échoue → **STOP**. Ne pas exécuter la requête.
Signaler à Audrey : « Variable DATABASE_URL absente ou ne pointe pas vers
Neon. Je m'arrête. »

Raison : sans cette vérification, `psql` se connecte à un PostgreSQL local
par défaut. Un audit précédent a interrogé une mauvaise DB et conclu à
tort que le schéma était cassé.

---

## Garde-fou 2 — Vérifier la branche Neon avant toute écriture

Avant tout `db:push`, `drizzle-kit migrate`, `psql -c "ALTER..."`,
`psql -c "DROP..."`, `psql -c "INSERT..."` ou autre mutation :

1. Lister les tables présentes :
   ```bash
   psql "$DATABASE_URL" -c "\dt"
   ```
2. Vérifier que la liste contient au moins :
   `centre`, `user`, `workshop_type`, `ticket_slot`.
3. Si une de ces tables manque → **STOP**. La DB n'est pas celle d'Asanblé.

Communiquer le résultat à Audrey AVANT d'exécuter la mutation.

---

## Garde-fou 3 — Lire avant d'écrire

Avant toute migration ou edit de schéma :

1. Lire le schéma TS actuel (`/server/db/schema/*.ts`).
2. Lire les migrations existantes (`/server/db/migrations/*.sql`).
3. Interroger Neon en SELECT pour confirmer l'état réel
   (`information_schema.columns`, `pg_constraint`).
4. Comparer les trois sources. Si drift → **STOP** et rapport.

Aucune écriture sans les 3 lectures.

---

## Garde-fou 4 — Pas d'identifiant inventé

Toute table, colonne, fonction, statut, route, type, FK, contrainte référencé
dans une réponse, un commentaire ou un code généré DOIT provenir d'une
lecture montrable (fichier:ligne ou résultat SELECT).

Si un identifiant n'est pas vérifié → écrire « Je ne sais pas » et demander.

Exemples interdits :
- « la colonne `created_by` de `session_group`... » sans avoir lu la table.
- « le statut `validated`... » sans avoir lu le CHECK constraint.
- « la fonction `getOccurrences()`... » sans `grep` au préalable.

---

## Garde-fou 5 — Phase 0 obligatoire pour toute session DB-touching

Toute session qui implique migration, edit de schéma, server action liée à
la DB, ou seed COMMENCE par un rapport Phase 0 avant toute écriture :

```markdown
## Phase 0 — Vérification

1. Schéma TS lu : [liste fichiers, OK/KO]
2. Migrations Drizzle lues : [liste, dernière appliquée]
3. État DB Neon (SELECT) : [tables présentes, contraintes, drift éventuel]
4. Décisions spec applicables : [liste sections spec-v1.md concernées]
5. Plan d'action : [étapes prévues, dans l'ordre]
6. Points de vérification : [où je m'arrête pour GO]

ATTENTE GO EXPLICITE.
```

Pas de code écrit, pas de migration générée, pas de commande exécutée avant
le GO d'Audrey sur le rapport.

---

## Garde-fou 6 — Mutations irréversibles sur GO explicite uniquement

Actions qui exigent un GO explicite par tour, jamais en autonomie :

- `db:push`
- `drizzle-kit migrate`
- `pnpm run db:seed` (efface et reseed)
- Tout `DROP`, `TRUNCATE`, `ALTER TABLE`, `DELETE` via `psql`
- Git push sur `main`
- `pnpm run build` suivi d'un deploy
- Création/suppression de branches Neon

Même si le rapport Phase 0 est vert, attendre le GO explicite avant chaque
mutation irréversible.

---

## Garde-fou 7 — « Je ne sais pas » obligatoire

Si une information n'est pas vérifiable par lecture directe (fichier, output
de commande, SELECT), écrire littéralement « Je ne sais pas ».

Mots et tournures interdits :
- « il semble que »
- « probablement »
- « je suppose »
- « normalement »
- « ça devrait »
- « en général »

Ces formulations cachent des inventions. Soit on sait (et on cite la source),
soit on ne sait pas (et on le dit).

---

## Garde-fou 8 — Une seule action irréversible par tour

Pas d'enchaînement automatique du type :
- `db:push` puis `seed` puis `dev`
- migrate puis update seed puis restart
- générer migration puis l'exécuter dans la foulée

Une action → vérification → rapport → GO suivant → action suivante.

Le rythme est ralenti volontairement. Mieux vaut 4 tours propres qu'un tour
qui casse silencieusement.

---

## Garde-fou 9 — Spec V1 est la source unique

Le document `/docs/spec-v1.md` est la référence métier et technique.
En cas de doute entre la spec, le schéma DB et le code :

1. Lire la spec.
2. Si la spec n'a pas la réponse → demander à Audrey.
3. Si la spec contredit le code → STOP, signaler la divergence,
   Audrey tranche.

Ne JAMAIS coder selon une hypothèse non documentée dans la spec.
Ne JAMAIS modifier la spec sans demande explicite d'Audrey.

---

## Garde-fou 10 — Mémoire d'audit

À la fin de chaque session impliquant une mutation DB, produire un mini
récap dans la réponse :

```
Mutations appliquées ce tour :
- [type] [cible] [résultat]

État final vérifié :
- [requête SELECT de vérification + résultat]

Prochain point de vérification proposé : [...]
```

But : laisser une trace traçable dans l'historique conversationnel pour
qu'Audrey puisse auditer sans relire tout le code.

---

## Résumé — réflexe en cas de doute

```
Si tu n'es pas sûr → tu ne fais rien.
Tu écris « Je ne sais pas » et tu demandes.
Le coût d'un tour de question est de 30 secondes.
Le coût d'une action mal informée est de plusieurs heures.
```
