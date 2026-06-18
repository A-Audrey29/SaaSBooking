# Asanblé — Spécification V1

> Source unique de vérité fonctionnelle et technique pour la V1.
> **Basée sur le code réel** — dernière mise à jour 2026-06-17.
> En cas de divergence entre ce document et le code : le code a raison.

---

## 1. Modèle de données

20 tables au total. Structure complète basée sur `/server/db/schema/`.

### 1.1 Tables auth (gérées par Better Auth)

| Table | Rôle |
|---|---|
| `user` | Étendu : `centre_id`, `role`, `password_set`, `deleted_at` |
| `session` | Sessions auth actives |
| `account` | Comptes OAuth (non utilisé V1) |
| `verification` | Tokens magic link |

#### `user` — colonnes métier ajoutées
| Colonne | Type | Notes |
|---|---|---|
| `centre_id` | uuid FK → centre, nullable | `NULL` = super_admin (bypass centre) |
| `role` | text CHECK | `super_admin \| project_admin \| referent \| provider` |
| `password_set` | boolean default false | Temporaire dev local |
| `deleted_at` | timestamptz nullable | Soft delete — bloque connexion |

Index unique `email` partiel sur `deleted_at IS NULL` (permet réutilisation email après soft delete).

---

### 1.2 Tables référentiels

#### `centre` — tenant racine
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `nom`, `adresse`, `ville`, `timezone`, `telephone`, `email` | text | `timezone` default `America/Guadeloupe` |
| `created_at`, `updated_at`, `deleted_at` | timestamptz | UTC |

#### `metier` — référentiel des métiers prestataires
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `nom` | text NOT NULL | ex. "Psychologue", "Coach sportif" |
| `color` | text nullable | hex couleur pour affichage badges |
| `created_at`, `updated_at`, `deleted_at` | timestamptz | UTC |

Table globale (pas de `centre_id`). Source de vérité pour le matching métier prestataire ↔ slot.

#### `workshop_type` — template d'atelier
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `centre_id` | uuid FK → centre, **NULLABLE** | `NULL` = template global admin, valeur = propre au centre |
| `code` | text UNIQUE | ex. `PARENTALITE`, `SPORT_SANTE` |
| `nom`, `description` | text | |
| `created_at`, `updated_at`, `deleted_at` | timestamptz | |

En V1, `createWorkshop` insère `centreId = NULL` (catalogue global). Les centres voient le catalogue global.

#### `workshop_role_group` — groupe de besoins (logique OU entre groupes)
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `workshop_type_id` | uuid FK → workshop_type, cascade | |
| `label` | text | ex. "Configuration standard" |
| `ordre` | integer default 0 | tri d'affichage |
| `created_at`, `updated_at`, `deleted_at` | timestamptz | |

Un `workshop_type` a N groupes. Logique OU entre groupes : le référent choisit UN groupe à la création de l'occurrence.

#### `workshop_role_slot` — un besoin individuel (logique ET dans un groupe)
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `workshop_role_group_id` | uuid FK → workshop_role_group, cascade | |
| `metier_id` | uuid FK → metier, RESTRICT | matching via `metier.id` |
| `is_optional` | boolean default false | `true` = pré-décoché UI référent |
| `ordre` | integer default 0 | |
| `created_at`, `updated_at`, `deleted_at` | timestamptz | |

**Règle 1 slot = 1 personne.** Pour 2 animateurs, créer 2 slots.
Couleur du slot affichée via `metier.color` (pas de colonne `couleur` sur slot).

---

### 1.3 Tables projets et instances

#### `project`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `centre_id` | uuid FK → centre, RESTRICT NOT NULL | |
| `nom`, `description`, `financeur` | text | |
| `start_date`, `end_date` | date nullable | |
| `created_at`, `updated_at`, `deleted_at` | timestamptz | |

#### `workshop` — atelier concret
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `project_id` | uuid FK → project, RESTRICT NOT NULL | |
| `centre_id` | uuid FK → centre, **NULLABLE**, SET NULL | `NULL` = catalogue global admin (BDR-022) |
| `type_id` | uuid FK → workshop_type, RESTRICT nullable | |
| `nom`, `description` | text | |
| `seances_count` | integer default 1 | nb de séances prévues |
| `duration_min` | integer default 90 | durée en minutes |
| `created_at`, `updated_at`, `deleted_at` | timestamptz | |

#### `session_group` — groupe d'occurrences pour un public
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `workshop_id` | uuid FK → workshop, RESTRICT NOT NULL | |
| `centre_id` | uuid FK → centre, RESTRICT NOT NULL | |
| `nom` | text NOT NULL | ex. "Groupe Parents" |
| `audience` | text nullable | description du public, ex. "8 ados 13–16 ans" |
| `notes` | text nullable | |
| `session_number` | integer nullable | numéro de session |
| `seance_number` | integer nullable | numéro de séance dans la session |
| `created_by` | uuid FK → user, SET NULL nullable | traçabilité créateur |
| `created_at`, `updated_at`, `deleted_at` | timestamptz | |

#### `occurrence` — une séance
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `session_group_id` | uuid FK → session_group, cascade NOT NULL | |
| `index` | integer NOT NULL | n° de séance dans le groupe (1..N) |
| `start_at`, `end_at` | timestamptz **NULLABLE** | dates fixées lors de la sélection de dispo, pas à la création |
| `lieu`, `salle`, `notes` | text nullable | |
| `statut` | text CHECK NOT NULL | `planned \| confirmed \| completed \| cancelled` |
| `workshop_role_group_id` | uuid FK → workshop_role_group, SET NULL nullable | groupe choisi à la création |
| `created_at`, `updated_at`, `deleted_at` | timestamptz | |

**Point clé :** `start_at/end_at` sont nullable en V1. Les dates sont renseignées après création, via le calendrier de disponibilité.

#### `ticket` — demande agrégée pour une occurrence
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `occurrence_id` | uuid FK → occurrence, cascade NOT NULL | |
| `statut` | text CHECK NOT NULL | mêmes valeurs que ticket_slot |
| `created_at`, `updated_at`, `deleted_at` | timestamptz | |

#### `ticket_slot` — un slot de demande individuel (1 rôle à pourvoir)
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `ticket_id` | uuid FK → ticket, cascade NOT NULL | |
| `provider_role` | text NOT NULL | valeur copiée depuis `metier.nom` à la création |
| `workshop_role_slot_id` | uuid nullable, **pas de FK stricte** | traçabilité vers le template |
| `provider_id` | uuid FK → provider, SET NULL nullable | prestataire assigné |
| `statut` | text CHECK NOT NULL | voir §5.1 |
| `sent_at` | timestamptz nullable | quand la demande a été envoyée |
| `responded_at` | timestamptz nullable | quand le prestataire a répondu |
| `created_at`, `updated_at`, `deleted_at` | timestamptz | |

---

### 1.4 Tables prestataires

#### `provider`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid UNIQUE FK → user, SET NULL nullable | lien compte auth (BDR-010) |
| `nom`, `email` | text NOT NULL | |
| `telephone`, `ville`, `bio` | text nullable | |
| `metier_id` | uuid FK → metier, RESTRICT nullable | métier principal |
| `created_at`, `updated_at`, `deleted_at` | timestamptz | |

Pas de scoping `centre_id` sur `provider` en V1 — les prestataires sont globaux (BDR-017, Guadeloupe couvre le territoire entier).

#### `provider_assignment` — lien prestataire/projet
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `provider_id` | uuid FK → provider, RESTRICT NOT NULL | |
| `project_id` | uuid FK → project, RESTRICT NOT NULL | |
| `metier_id` | uuid FK → metier, RESTRICT NOT NULL | |
| `created_at`, `deleted_at` | timestamptz | soft delete |

Contrainte UNIQUE sur `(provider_id, project_id, metier_id)`.
**Note V1 :** `provider_assignment` n'est pas utilisé pour filtrer les prestataires dans `getProvidersForSlot` — le filtre passe par `metier_id` + `provider_availability` (BDR-009).

#### `provider_availability` — créneaux de disponibilité
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `provider_id` | uuid FK → provider, CASCADE NOT NULL | |
| `start_at` | timestamptz NOT NULL | UTC |
| `end_at` | timestamptz NOT NULL | UTC |
| `kind` | text CHECK NOT NULL default `available` | `available \| unavailable` |
| `created_at`, `updated_at`, `deleted_at` | timestamptz | soft delete |

`kind = 'unavailable'` = exception horaire qui efface les `available` chevauchants (sauf protégés par slot `confirmed`).
Granularité : 30 minutes. Chevauchements non contraints en DB V1.

---

### 1.5 Tables transverses

#### `audit_log`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `centre_id` | uuid nullable | `NULL` pour actions super_admin |
| `user_id` | uuid NOT NULL | qui a fait l'action |
| `action` | text NOT NULL | `create \| update \| soft_delete` |
| `entity_type` | text NOT NULL | nom de la table |
| `entity_id` | uuid NOT NULL | id de l'entité |
| `before`, `after` | jsonb nullable | snapshots avant/après |
| `created_at` | timestamptz NOT NULL | |

#### `user_invitation`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → user, CASCADE NOT NULL | |
| `token` | text UNIQUE NOT NULL | |
| `expires_at` | timestamptz NOT NULL | |
| `used_at` | timestamptz nullable | |
| `created_at` | timestamptz NOT NULL | |

---

## 2. Rôles et permissions

### 2.1 Les 4 rôles

| Rôle | Description |
|---|---|
| `super_admin` | Équipe Asanblé. Bypass `centre_id`. Accès `/admin/*`. |
| `project_admin` | Admin délégué d'un centre. Accès `/admin/*`. |
| `referent` | Personnel centre social. Crée sessions, trouve prestataires. Accès `/app/*`. |
| `provider` | Prestataire externe. Voit missions, accepte/refuse. Accès `/pro/*`. |

### 2.2 Matrice d'accès par espace

| Espace | super_admin | project_admin | referent | provider |
|---|---|---|---|---|
| `/admin/*` | ✅ | ✅ | ❌ | ❌ |
| `/app/*` | ❌ | ❌ | ✅ | ❌ |
| `/pro/*` | ❌ | ❌ | ❌ | ✅ |

### 2.3 Règle multi-tenant (invariant absolu)

Toute requête SELECT/UPDATE/DELETE sur entité avec `centre_id` (direct ou indirect) passe par `applyCenterScope(ctx, query)`.

- `super_admin` : filtre `deleted_at IS NULL` uniquement.
- Autres : filtre `centre_id = ctx.centreId AND deleted_at IS NULL`.

`centreId` vient toujours de `ServerContext {userId, centreId, role}`. Jamais du client.

### 2.4 Providers — pas de scoping centre en V1

`provider` n'a pas de `centre_id`. Tous les prestataires sont visibles par tous les centres. Décision BDR-017 : Guadeloupe = territoire unique, scoping serait contre-productif.

---

## 3. Logique ET/OU sur les besoins de rôles

- Un `workshop_type` a N `workshop_role_group`.
- **OU entre groupes** : à la création d'une occurrence, le référent choisit UN groupe.
- **ET entre slots du groupe choisi** : tous les slots requis seront pourvus.
- Slots `is_optional = true` = pré-décochés. Le référent coche s'il veut.

**QuickCreate (BDR-016) :** Un drawer crée `workshop_type` + `workshop_role_group` + `workshop_role_slot` en une transaction atomique (pas de flow 3 étapes séparé).

---

## 4. Création d'une session — flux

### 4.1 Server action `createSessionGroup`

Transaction atomique unique :
1. Crée `session_group` (`centre_id = ctx.centreId`, `created_by = ctx.userId`)
2. Crée 1 `occurrence` (`start_at/end_at = NULL`, `statut = planned`, `workshop_role_group_id` rempli)
3. Crée 1 `ticket` pour l'occurrence
4. Pour chaque slot **coché** : crée 1 `ticket_slot` (`statut = empty`, copie `metier.nom` dans `provider_role`, garde `workshop_role_slot_id` pour traçabilité)
5. Pour chaque slot requis **décoché** : crée 1 `ticket_slot` (`statut = skipped`)
6. Pas de slot créé pour les optionnels non cochés

### 4.2 Validation Zod (entrée)

```
workshopId, workshopRoleGroupId : uuid
checkedSlotIds : uuid[] (min 1)
nom : string (1–200 chars)
sessionNumber, seanceNumber : integer (1–999)
notes : string optional (max 1000)
```

---

## 5. Machines à états

### 5.1 `ticket_slot.statut`

Valeurs : `empty | pending | confirmed | refused | cancelled | done | skipped`

> **Distinction critique — `skipped` ≠ `cancelled`**
>
> `skipped` = référent écarte intentionnellement ce besoin. Séance a lieu. Slot non à pourvoir.
> `cancelled` = occurrence annulée. Séance n'a pas lieu. Tous les slots tombent en cascade.
> Confondre les deux fausse les stats et `occurrence.statut`.

Transitions autorisées :

| De | Vers | Acteur | Effet |
|---|---|---|---|
| `empty` | `pending` | referent | `provider_id` rempli, `sent_at = now()` |
| `empty` | `skipped` | referent | retrait du besoin |
| `pending` | `empty` | referent | annulation demande (`provider_id` conservé, visible dans `/pro/missions` comme "annulé") |
| `pending` | `skipped` | referent | retrait du besoin sur demande en cours (`provider_id` effacé) |
| `pending` | `confirmed` | provider | acceptation (`responded_at = now()`) |
| `pending` | `refused` | provider | refus (`responded_at = now()`) |
| `refused` | `pending` | referent | réassignation à un autre prestataire |
| `refused` | `skipped` | referent | abandon du slot |
| `confirmed` | `cancelled` | système | cascade depuis annulation occurrence |
| `confirmed` | `done` | système | à implémenter V1.5 (cron ou trigger lecture) |
| toutes actives | `cancelled` | système | cascade `cancelOccurrence` — **non implémenté V1** |

États terminaux : `done`, `cancelled`, `skipped` → aucune transition sortante.

### 5.2 `occurrence.statut`

Valeurs : `planned | confirmed | completed | cancelled`

Dérivé par `recomputeOccurrenceStatut(occurrenceId)`, appelé dans la même transaction que toute mutation `ticket_slot.statut`.

Règles (dans l'ordre) :
1. Annulation explicite → `cancelled` (figé)
2. Tous slots actifs (hors `skipped/cancelled`) sont `done` → `completed`
3. Tous slots actifs sont `confirmed` ou `done` → `confirmed`
4. Sinon → `planned`

Note UI : "bloqué" (au moins un `refused` + un `empty`) = dérivé à l'affichage depuis `planned`, pas une valeur DB.

### 5.3 `cancelOccurrence` — déféré V1.5

Pas implémenté en V1. Comportement prévu :
- `occurrence.statut = cancelled`
- Cascade tous `ticket_slot` actifs → `cancelled`
- `logAudit()` avec `raison` dans `after.raison`

---

## 6. Assignation prestataire

### 6.1 `getProvidersForSlot(slotId)`

Filtre :
1. `ticket_slot` → `workshop_role_slot` → `metier_id`
2. `provider.metier_id = metier_id` ET `provider.deleted_at IS NULL`
3. `provider_availability` (kind `available`) couvre l'occurrence : `availability.start_at <= occurrence.start_at AND availability.end_at >= occurrence.end_at`
4. `provider_availability.deleted_at IS NULL`

Résultat trié par `provider.nom`.

### 6.2 Disponibilités prestataire — 3 modes

| Mode | Server action | Comportement |
|---|---|---|
| Ponctuel | `createAvailability` | Simple insert |
| Exception | `createDateException` | Si `unavailable` : soft-delete les `available` chevauchants (sauf protégés par `confirmed`) |
| Récurrent | `createRecurringAvailabilities` | "Full replacement" : purge TOUS les `available` non protégés + génère nouveaux créneaux pour les jours/plages activés dans la fenêtre `[from, to]` |

Granularité : 30 min. Format heure : `"HH:MM"` en timezone `America/Guadeloupe`.

---

## 7. Audit log

### 7.1 Entités loggées en V1

| Entité | Actions loggées |
|---|---|
| `ticket_slot` | Transitions de statut uniquement — `before.statut` + `after.statut` + acteur |

### 7.2 Déféré V1.5

Audit complet prévu (non implémenté) : `user`, `centre`, `project`, `provider_assignment`.

### 7.3 Implémentation

Fonction unique `logAudit(ctx, action, entityType, entityId, before, after)` dans `/server/queries/audit.ts`. Appelée explicitement dans chaque server action. Pas de trigger DB.

---

## 8. Auth

- Better Auth, magic link uniquement en V1
- Pas de signup public — création par invitation admin (`user_invitation`)
- Email via Resend
- Hook `signIn` : rejette `user.deleted_at IS NOT NULL`
- Dispatch post-login :
  - `super_admin / project_admin` → `/admin`
  - `referent` → `/app`
  - `provider` → `/pro`
- `password_set` = vestige dev local — désactiver avant prod (voir BLK-011)

---

## 9. Invariants techniques

- UUID PK partout
- `TIMESTAMPTZ` stockés UTC, affichage en `America/Guadeloupe`
- `deleted_at` sur toutes les tables métier (soft delete — pas de DELETE physique en V1)
- Validation Zod en entrée sur chaque server action (`/server/validations/`)
- `requireRole()` en début de chaque route serveur
- `applyCenterScope()` sur toute requête multi-tenant
- Transactions Drizzle pour toute mutation multi-table
- Toute mutation `ticket_slot.statut` passe uniquement par `updateTicketSlotStatut()` (vérifie transition → update → `recomputeOccurrenceStatut` → `logAudit` → tout en 1 transaction)

---

## 10. Déféré V1.5

| Feature | Raison du report |
|---|---|
| `cancelOccurrence()` cascade | Flux annulation complet, non prioritaire MVP |
| `confirmed → done` via cron | Infrastructure jobs async hors scope V1 |
| Audit complet user/centre/project | Volume audit faible V1 (< 3 centres) |
| Filtre rôle sur référentiels (§2.3 initial) | Admin gère catalogue globalement en V1 |
| Clone catalogue global → centre | YAGNI V1 |
| Scoping provider par centre | BDR-017, territoire Guadeloupe |
| Documents prestataires | Upload/validation infra non prioritaire |
| RLS Postgres | Isolation applicative suffisante V1 |

---

## 11. Glossaire

| Terme | Définition |
|---|---|
| `centre` | Structure cliente, tenant racine |
| `project` | Programme financé (REAAP, etc.), rattaché à 1 centre |
| `metier` | Métier d'un prestataire (ex. Psychologue) — référentiel global |
| `workshop_type` | Template d'atelier, nullable `centre_id` = global |
| `workshop_role_group` | Groupe de besoins. OU entre groupes |
| `workshop_role_slot` | Besoin individuel (1 personne, 1 métier, optionnel ou requis) |
| `workshop` | Atelier concret rattaché à un projet |
| `session_group` | Groupe d'occurrences pour un public donné |
| `occurrence` | Une séance (dates nullable jusqu'à sélection dispo) |
| `ticket` | Demande agrégée pour une occurrence |
| `ticket_slot` | Un slot individuel = 1 rôle à pourvoir sur 1 occurrence |
| `provider_availability` | Créneau de disponibilité prestataire (`available` ou `unavailable`) |
