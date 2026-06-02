# Asanblé — Spécification V1

> Source unique de vérité fonctionnelle et technique pour la V1.
> Toute divergence entre ce document, le schéma DB et le code = bug.
> Mise à jour : chaque décision validée doit être reflétée ici dans la même PR.

---

## 1. Modèle de données cible (post-migration)

Schéma final après migration D1/D2/D4bis appliquée. Tables existantes
maintenues sauf mention contraire.

### 1.1 Tables référentiels (multi-tenant)

#### `centre` — entité tenant racine
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `nom`, `adresse`, `ville`, `timezone`, `telephone`, `email` | text | |
| `created_at`, `updated_at`, `deleted_at` | timestamptz | UTC |

#### `workshop_type` — template d'atelier
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `centre_id` | uuid FK → centre, **NULLABLE** | `NULL` = template global Asanblé, valeur = template propre au centre |
| `code` | text | code interne (ex. `PARENTALITE`) |
| `nom`, `description` | text | |
| `created_at`, `updated_at`, `deleted_at` | timestamptz | `deleted_at` à ajouter |

**Changement migration** : ajout `centre_id NULL` + `deleted_at`.

#### `workshop_role_group` — groupe de besoins (NOUVELLE TABLE)
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `workshop_type_id` | uuid FK → workshop_type, cascade | |
| `label` | text | ex. "Configuration standard", "Configuration sport" |
| `ordre` | integer | tri d'affichage |
| `created_at`, `updated_at`, `deleted_at` | timestamptz | |

Sémantique : un `workshop_type` peut avoir N `workshop_role_group`. Le "OU" est
exprimé entre groupes (le référent choisit UN groupe à la création de
l'occurrence). Le "ET" est exprimé entre les slots d'un même groupe.

#### `workshop_role_slot` — un besoin dans un groupe (NOUVELLE TABLE)
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `workshop_role_group_id` | uuid FK → workshop_role_group, cascade | |
| `role` | text | une seule valeur (pas de OU dans un slot) |
| `couleur` | text | hex, héritée de l'ancien provider_role |
| `is_optional` | boolean default false | true = pré-décoché côté UI référent |
| `ordre` | integer | |
| `created_at`, `updated_at`, `deleted_at` | timestamptz | |

**Règle 1 slot = 1 personne** : pas de colonne `quantite`. Si l'admin veut
2 animateurs, il crée 2 slots dans le groupe.

#### `provider_role` — **À SUPPRIMER**
Remplacée par `workshop_role_group` + `workshop_role_slot`. Le seed actuel
(5 lignes) sera migré dans la nouvelle structure : 1 groupe par
`workshop_type` existant, 1 slot par ligne actuelle.

### 1.2 Tables projets et instances

#### `project`
Inchangé. `centre_id NOT NULL`.

#### `workshop`
Inchangé. Lié à `project` (qui porte `centre_id`).

#### `session_group`
Inchangé. `centre_id NOT NULL`. Représente un groupe d'occurrences pour un
public donné (ex. "Groupe Parents — Session 1").

#### `occurrence`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `session_group_id` | uuid FK → session_group, cascade | |
| `index` | integer | n° de séance dans le groupe (1..N) |
| `start_at`, `end_at` | timestamptz | UTC |
| `lieu`, `salle`, `notes` | text | |
| `statut` | text CHECK | voir §5 |
| `workshop_role_group_id` | uuid FK, **NULLABLE** | groupe choisi à la création (NOUVELLE COLONNE) |
| `created_at`, `updated_at`, `deleted_at` | timestamptz | |

**Changement migration** : ajout `workshop_role_group_id` pour tracer quel
groupe a été choisi lors de la création.

#### `ticket`
Inchangé. 1 ticket = 1 occurrence = N slots.

#### `ticket_slot`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `ticket_id` | uuid FK → ticket, cascade | |
| `provider_role` | text NOT NULL | **valeur copiée** depuis `workshop_role_slot.role` à la création (text libre, pas FK) |
| `workshop_role_slot_id` | uuid FK, **NULLABLE** | traçabilité vers le template (NOUVELLE COLONNE, pas de cascade DELETE) |
| `provider_id` | uuid FK → provider, set null | |
| `statut` | text CHECK | voir §5 |
| `sent_at`, `responded_at` | timestamptz | |
| `created_at`, `updated_at`, `deleted_at` | timestamptz | |

**Changement migration** : ajout `workshop_role_slot_id` nullable pour
traçabilité, sans FK stricte (pas de cascade).

### 1.3 Tables auth et provider

`user`, `session`, `account`, `verification` — inchangées (Better Auth).
`provider`, `provider_assignment` — inchangées.

### 1.4 Audit

#### `audit_log`
Inchangée structurellement. Câblée en V1 (voir §6).

---

## 2. Rôles et permissions

### 2.1 Les 4 rôles

| Rôle | Description | Multi-instance |
|---|---|---|
| `super_admin` | Équipe Asanblé. Voit tout, bypasse `centre_id`. | Plusieurs comptes possibles |
| `project_admin` | Admin d'un centre (V1.5+). En V1 = admin Asanblé délégué par centre. | Plusieurs par centre |
| `referent` | Personnel d'un centre social. Crée des sessions et trouve des prestataires. | Plusieurs par centre |
| `provider` | Prestataire externe. Voit ses missions, accepte/refuse. | N/A |

### 2.2 Règle multi-tenant (invariant absolu)

**Toute requête SELECT/UPDATE/DELETE sur une entité avec `centre_id` (direct
ou indirect) DOIT passer par `applyCenterScope(ctx, query)` ou équivalent
typé.**

Comportement :
- `super_admin` : filtre `deleted_at IS NULL` uniquement.
- Autres : filtre `centre_id = ctx.centreId AND deleted_at IS NULL`.

### 2.3 Cas spécifique des référentiels nullables

`workshop_type`, `workshop_role_group`, `workshop_role_slot` ont `centre_id`
nullable (directement ou hérité). Règle d'affichage :

| Rôle | Voit |
|---|---|
| `super_admin` | TOUT (globaux + tous centres) |
| `project_admin` | UNIQUEMENT `centre_id = ctx.centreId` (pas les globaux) |
| `referent` | UNIQUEMENT `centre_id = ctx.centreId` (pas les globaux) |
| `provider` | N/A (ne consomme pas ces tables) |

**Conséquence UX V1** : un centre nouvellement créé démarre avec un catalogue
vide. Pas de "clone from global" en V1. À implémenter V1.5.

### 2.4 Matrice d'accès par espace

| Espace | super_admin | project_admin | referent | provider |
|---|---|---|---|---|
| `/admin/*` | ✅ | ✅ | ❌ | ❌ |
| `/app/*` | ❌ | ❌ | ✅ | ❌ |
| `/pro/*` | ❌ | ❌ | ❌ | ✅ |

Implémentation : `requireRole()` en début de chaque route serveur.

---

## 3. Logique ET/OU sur les besoins de rôles (Modèle A)

### 3.1 Sémantique

- Un `workshop_type` a N `workshop_role_group`.
- Le **OU** s'exprime entre groupes : à la création d'une occurrence, le
  référent choisit UN groupe.
- Le **ET** s'exprime entre les slots d'un groupe : tous les slots requis du
  groupe choisi seront pourvus.
- Les slots `is_optional = true` sont pré-décochés. Le référent les coche
  s'il veut.

### 3.2 Exemple métier

`workshop_type` : "Atelier bien-être famille"
- Groupe 1 "Configuration standard" :
  - Slot Psychologue (requis)
  - Slot Animateur (requis)
  - Slot Coach sportif (optionnel)
- Groupe 2 "Configuration sport" :
  - Slot Coach sportif (requis)
  - Slot Éducateur sportif (requis)

À la création d'une occurrence, le référent choisit Groupe 1 OU Groupe 2.
Si Groupe 1 : 2 tickets créés (Psy, Animateur). Le Coach optionnel est
proposé en case à cocher, ticket créé seulement s'il coche.

### 3.3 Path V1.5 → Modèle B (multi-rôles équivalents)

Documenté pour mémoire, NON implémenté en V1 :
Ajouter une table `workshop_role_slot_alternative(workshop_role_slot_id, role)`
pour exprimer "ce slot peut être couvert par n'importe quel rôle de cette
liste". Migration future, ne casse pas la structure actuelle.

---

## 4. Création d'une occurrence — flux complet

### 4.1 Préconditions

- Le référent est connecté, `ctx.centreId` défini.
- Au moins un `workshop_type` visible pour son centre.
- Au moins un `workshop` créé sous un `project` du centre.

### 4.2 Étapes (server actions)

1. **Sélection du workshop** par le référent (UI).
2. **Affichage des `workshop_role_group`** du `workshop_type` du workshop.
3. **Sélection d'UN groupe** par le référent.
4. **Affichage des slots du groupe** : requis pré-cochés (décochables),
   optionnels pré-décochés (cochables).
5. **Saisie** : nom du groupe (audience), notes, dates des N occurrences.
6. **Submit** → server action `createSessionGroup` qui, en UNE transaction
   atomique :
   - Crée `session_group` (avec `centre_id = ctx.centreId`).
   - Crée N `occurrence` (avec `workshop_role_group_id` rempli).
   - Pour CHAQUE occurrence : crée 1 `ticket`.
   - Pour CHAQUE ticket : crée 1 `ticket_slot` par slot **coché**
     (requis non-décochés + optionnels cochés). Statut initial `empty`.
     Copie `role` dans `ticket_slot.provider_role` (text) et garde
     `workshop_role_slot_id` pour traçabilité.
   - Pour CHAQUE slot **décoché parmi les requis** : créer 1 `ticket_slot`
     statut `skipped`. **Pas** de slot créé pour les optionnels non cochés
     (Façon 2).

### 4.3 Invariants à coder

- Toute la création est atomique (Drizzle transaction).
- `occurrence.statut` initial = `planned`.
- `ticket.statut` initial = `empty`.
- L'audit_log enregistre la création du `session_group` (avant et après).

---

## 5. Machine à états

### 5.1 `ticket_slot.statut`

Valeurs autorisées (CHECK constraint existant) :
`empty, pending, confirmed, refused, cancelled, done, skipped`

> **⚠️ Distinction critique — `skipped` ≠ `cancelled`**
>
> **`skipped`** = le référent a intentionnellement écarté ce besoin.
> La séance a lieu normalement. Le slot n'est pas à pourvoir.
> Exemple : "pas besoin de coach sportif pour cette séance-ci".
>
> **`cancelled`** = l'occurrence entière est annulée.
> La séance n'a pas lieu. Tous les slots tombent en cascade.
> Exemple : "la séance du 14 mai est annulée".
>
> Confondre les deux fausse les stats et le calcul de `occurrence.statut`.

Transitions autorisées :

| De | Vers | Acteur | Effet |
|---|---|---|---|
| `empty` | `pending` | referent | assignation à un provider (`provider_id` rempli, `sent_at` rempli) |
| `pending` | `confirmed` | provider | acceptation (`responded_at` rempli) |
| `pending` | `refused` | provider | refus (`responded_at` rempli) |
| `pending` | `empty` | referent | **annulation demande** (provider_id repassé à NULL, sent_at conservé pour audit) |
| `refused` | `pending` | referent | réassignation à un autre provider |
| `empty` | `skipped` | referent | retrait du besoin |
| `pending` | `skipped` | referent | retrait du besoin sur demande en cours |
| `refused` | `skipped` | referent | abandon du slot |
| `confirmed` | `cancelled` | referent | **annulation slot confirmé** (notification provider à câbler, raison obligatoire dans audit_log) |
| `confirmed` | `done` | système | séance passée + slot confirmé (cron/batch ou trigger à la lecture) |
| toutes actives | `cancelled` | système | cascade depuis `occurrence.statut = cancelled` |

Transitions interdites (à coder dans la fonction de mutation, à tester) :
- `confirmed → pending` (pas de retour en arrière silencieux)
- `done → *` (terminal)
- `cancelled → *` (terminal)
- `skipped → *` (terminal en V1, réactivation modélisable V1.5)

### 5.2 `occurrence.statut`

Valeurs autorisées (CHECK constraint existant) :
`planned, confirmed, completed, cancelled`

> **⚠️ Précondition création occurrence** : le référent ne peut créer une
> occurrence que si son centre possède au moins un `workshop_type` avec
> `centre_id = ctx.centreId`. Un centre nouvellement créé démarre avec un
> catalogue vide (pas de clone global en V1). Si le catalogue est vide,
> bloquer la création et afficher un message explicite.

**Statut dérivé** par fonction unique `recomputeOccurrenceStatut(occurrenceId)`,
appelée systématiquement dans la même transaction que toute mutation de
`ticket_slot.statut`.

Règles de dérivation (dans cet ordre) :
1. Si l'occurrence a été annulée explicitement → `cancelled` (statut figé).
2. Tous les slots actifs (hors `skipped`) sont `done` → `completed`.
3. Tous les slots actifs sont `confirmed` ou `done` → `confirmed`.
4. Au moins un slot `empty` ou `refused` → `planned`.
5. Sinon → `planned`.

Note : on a 4 valeurs en DB mais conceptuellement le statut "blocked"
(au moins un refused + un empty) est utile côté UI. Choix V1 : rester sur
`planned` en DB, dériver `blocked` à l'affichage par règle UI.

### 5.3 Annulation d'occurrence (cascade)

Server action `cancelOccurrence(occurrenceId, raison)` :
- En 1 transaction :
  - `occurrence.statut = cancelled`.
  - Tous les `ticket_slot` actifs de l'occurrence : `statut = cancelled`.
  - Audit_log : entrée avec `raison` dans `after.raison`.

---

## 6. Audit_log

### 6.1 Entités loggées en V1

| Entité | Actions | Niveau de détail |
|---|---|---|
| `user` | create, update (rôle, centre_id), soft_delete | before + after diffs |
| `centre` | create, update, soft_delete | before + after |
| `project` | create, update, soft_delete | before + after |
| `provider_assignment` | create, soft_delete | before + after |
| `ticket_slot` | **transitions de statut uniquement** | `before.statut` + `after.statut` + acteur |

### 6.2 Entités NON loggées en V1

`workshop_type`, `workshop_role_group`, `workshop_role_slot`, `workshop`,
`session_group`, `occurrence` création/édition pure (mais l'annulation
d'occurrence est loggée via le ticket_slot cascade).

### 6.3 Implémentation

Fonction unique `logAudit(ctx, action, entityType, entityId, before, after)`
appelée explicitement dans chaque server action concernée. Pas de trigger
DB. Pas de magie. Visible dans le code.

---

## 7. Invariants techniques

### 7.1 Hygiène DB
- UUID PK partout (`gen_random_uuid()`).
- `created_at`, `updated_at`, `deleted_at` (timestamptz UTC) sur toutes les
  tables métier.
- Soft delete via `deleted_at IS NULL` partout. Pas de DELETE physique
  (sauf cascade FK Better Auth).
- Timestamps stockés UTC, conversion `America/Guadeloupe` en présentation.

### 7.2 Server actions
- Validation Zod en entrée (schemas centralisés dans `/server/validations/`).
- `requireRole()` en début.
- `applyCenterScope()` sur toute requête multi-tenant.
- Transactions Drizzle pour toute mutation multi-table.
- Retour typé (pas de `any`).

### 7.3 UI
- React Hook Form + Zod côté client.
- Pas de FormData parsing brut côté server action — recevoir un objet typé
  validé.
- shadcn/ui + Tailwind, pas de CSS custom sauf cas exceptionnel.

### 7.4 Mutations sensibles
Toute mutation de `ticket_slot.statut` passe par une fonction unique
`updateTicketSlotStatut(slotId, newStatut, ctx, options)` qui :
1. Vérifie la transition est autorisée (table §5.1).
2. Met à jour le slot.
3. Appelle `recomputeOccurrenceStatut(occurrenceId)`.
4. Appelle `logAudit()`.
5. Le tout en 1 transaction.

Aucune autre voie de mutation autorisée.

### 7.5 Auth
- Better Auth, magic link uniquement en V1.
- Pas de signup public. Création de compte par invitation admin uniquement
  (UI à implémenter en V1).
- Email via Resend.

---

## 8. Annexe — Plan de migration depuis l'état actuel

### 8.1 Diff conceptuel

| Action | Cible | Notes |
|---|---|---|
| ADD COLUMN | `workshop_type.centre_id` uuid NULL FK → centre | + index |
| ADD COLUMN | `workshop_type.deleted_at` timestamptz NULL | |
| CREATE TABLE | `workshop_role_group` | structure §1.1 |
| CREATE TABLE | `workshop_role_slot` | structure §1.1, incl. `is_optional` |
| MIGRATE DATA | `provider_role` → 1 `workshop_role_group` par `workshop_type` existant + 1 `workshop_role_slot` par ligne `provider_role` | script SQL/TS, à valider |
| DROP TABLE | `provider_role` | après vérif migration data |
| ADD COLUMN | `occurrence.workshop_role_group_id` uuid NULL FK | nullable car données pré-migration possibles (en V1 : aucune) |
| ADD COLUMN | `ticket_slot.workshop_role_slot_id` uuid NULL | pas de FK stricte, pas de cascade |
| UPDATE SEED | `/scripts/seed.ts` aligné nouveau modèle | groupes + slots cochés/optionnels |

### 8.2 Ordre d'exécution recommandé

1. Générer migration Drizzle 0003 avec les ADD COLUMN sur tables existantes.
2. Générer migration Drizzle 0004 avec CREATE TABLE des deux nouvelles.
3. Script TS de migration de données `provider_role` → nouvelles tables.
4. Migration Drizzle 0005 avec DROP TABLE `provider_role`.
5. Refonte seed.
6. Vérifications post-migration (counts, intégrité FK, statuts CHECK).

### 8.3 État actuel des données

D'après audit : 0 `session_group`, 0 `occurrence`, 0 `ticket`, 0 `ticket_slot`
en DB. 5 lignes dans `provider_role` (seed). Migration de données triviale
(5 lignes à transformer).

---

## 9. Glossaire (terminologie figée — toute divergence dans le code = bug)

| Terme | Définition |
|---|---|
| `centre` | Structure cliente, tenant racine. |
| `project` | Programme financé (REAAP, etc.). Rattaché à 1 centre. |
| `workshop_type` | Template d'atelier. Peut être global (`centre_id NULL`) ou propre à un centre. |
| `workshop_role_group` | Groupe de besoins de rôles dans un workshop_type. Le OU est entre groupes. |
| `workshop_role_slot` | Un besoin individuel (1 personne, 1 rôle, optionnel ou requis). |
| `workshop` | Atelier concret rattaché à un project, basé sur un workshop_type. |
| `session_group` | Groupe d'occurrences pour un public donné. |
| `occurrence` | Une séance datée (workflow ancien : "seance"). |
| `ticket` | Demande agrégée pour une occurrence. |
| `ticket_slot` | Un slot de demande individuel = 1 rôle à pourvoir sur 1 occurrence. |

**Terminologie obsolète (ne plus utiliser)** :
`Session` (ancien Lovable), `Seance` (ancien), `RoleSlot` (ancien),
`acceptedRoles[]` (ancien Modèle B inline), `provider_role` (table à
supprimer V1).
