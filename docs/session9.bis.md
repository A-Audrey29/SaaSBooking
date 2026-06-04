# Session 9 — Vue sessions référent + assignation prestataire

## Contexte projet

Asanblé — plateforme SaaS B2B. Stack : Next.js 15 App Router, TypeScript,
Drizzle ORM, Neon Postgres, Better Auth, shadcn/ui, RHF + Zod.

**Lis CLAUDE.md AVANT toute action.** Gouvernance non négociable :
une action irréversible à la fois, sortie brute obligatoire, GO explicite
entre chaque gate.

---

## État entrant Session 9

- S8 committé (c2b2597) : `createSessionGroup` fonctionnel
- Migration 0010 appliquée, table `metier` présente
- Pattern server action établi :
  `requireRole` → Zod → transaction Drizzle → `logAudit` → `revalidatePath`
- Helpers disponibles :
  - `server/context/server-context.ts` : `requireRole()`, `applyCenterScope()`
  - `server/queries/audit.ts` : `logAudit()`
  - `server/queries/session-group.ts` : `listWorkshopsForCentre`,
    `getRoleGroupsForWorkshop`, `createSessionGroup` (existants)
- tsc vert au commit S8

---

## Objectif Session 9

**Trois blocs dans l'ordre strict :**

1. Vue liste sessions `/app` (page d'accueil référent)
2. Vue détail session `/app/sessions/[id]`
3. Logique d'assignation prestataire sur `ticket_slot` (transitions
   `empty → pending`, `pending → empty`, `empty/refused → skipped`)

**Hors périmètre Session 9 (ne pas implémenter) :**
- Transitions côté prestataire (`pending → confirmed`, `pending → refused`)
- Annulation d'occurrence (`cancelOccurrence`)
- Transition `confirmed → done` (système / cron)
- Espace `/pro/*`
- Notifications email

---

## Terminologie figée

| Terme | Définition |
|---|---|
| `session_group` | Groupe d'occurrences pour un public donné |
| `occurrence` | Une séance datée (1..N par session_group) |
| `ticket` | Demande agrégée, 1 par occurrence |
| `ticket_slot` | Un besoin individuel = 1 rôle à pourvoir sur 1 occurrence |
| `provider_assignment` | Affectation d'un prestataire à un projet |

---

## Phase 0 — Vérifications préalables OBLIGATOIRES

Avant d'écrire la moindre ligne de code, effectue TOUTES ces vérifications
et restitue les sorties brutes dans UN SEUL message structuré.

### 0.1 Lire les fichiers existants

Lis les fichiers suivants et confirme leur contenu exact :
- `server/queries/session-group.ts` : quelles fonctions existent déjà ?
- `server/db/schema/ticket.ts` (ou équivalent) : colonnes de `ticket`
- `server/db/schema/ticket-slot.ts` (ou équivalent) : colonnes de
  `ticket_slot` (confirme présence de `provider_id`, `sent_at`,
  `responded_at`, `statut`, `provider_role`)
- `server/db/schema/provider.ts` : colonnes de `provider`
- `server/db/schema/provider-assignment.ts` : colonnes de
  `provider_assignment` (confirme la FK vers `project`)
- `app/app/page.tsx` : contenu actuel du stub
- `app/app/sessions/new/session.actions.ts` : confirme que
  `createSessionGroup` existe et est exportée

Pour chaque fichier : affiche le chemin exact et les exports/colonnes clés.
Si un fichier est introuvable : STOP, signale, attends instruction.

### 0.2 Vérifier les données en DB

Lance un script tsx avec dotenv .env.local qui :
1. Compte les lignes dans : `session_group`, `occurrence`, `ticket`,
   `ticket_slot`, `provider_assignment`
2. Affiche 2 lignes sample de `session_group` avec leurs occurrences
   (pour confirmer que S8 a bien créé des données)
3. Affiche 2 lignes sample de `provider_assignment` avec
   `project_id` et `provider_id`

Affiche la sortie brute intégrale.
Si `session_group` = 0 lignes : STOP, signale (impossible de tester sans données S8).

### 0.3 Vérifier le join path provider_assignment → session

Confirme le chemin de join entre un `ticket_slot` et les prestataires
éligibles, en lisant les schémas :

`ticket_slot → ticket → occurrence → session_group → workshop → project → provider_assignment → provider`

Pour chaque FK dans cette chaîne, confirme : colonne source, table cible,
colonne cible, onDelete policy.
Affiche le tableau. Si une FK est manquante ou différente : STOP et signale.

### 0.4 Vérifier shadcn components disponibles

`ls components/ui/ | sort`

Identifier si ces composants sont présents :
- `select.tsx` (pour le Select prestataire)
- `badge.tsx` (pour les statuts colorés)
- `separator.tsx`

Signaler les manquants (ne pas les installer maintenant).

### 0.5 tsc --noEmit

`pnpm tsc --noEmit`
Affiche sortie brute. Si erreurs : STOP, signale, attends instruction.

### GATE 0 → STOP

Restitue tout dans un seul message structuré.
Attends GO explicite avant Phase 1.

---

## Phase 1 — Queries lecture (pas de mutation)

### 1.1 Ajouter dans `server/queries/session-group.ts`

Lis d'abord le fichier existant pour ne pas écraser les fonctions S8.

**Fonction A : `listSessionGroupsForCentre(centreId: string)`**

Retourne, pour chaque `session_group` du centre (filtré sur
`centre_id = centreId AND deleted_at IS NULL`) :
id, nom, centreId,
workshopNom (depuis workshop.nom),
typeNom (depuis workshop_type.nom via workshop → workshop_type),
occurrencesCount (COUNT occurrences non supprimées),
prochaineDateAt (MIN start_at des occurrences futures non supprimées),
statutsAgreges : { empty: number, pending: number, confirmed: number,
refused: number, skipped: number, cancelled: number }

Les `statutsAgreges` sont dérivés des `ticket_slot` des occurrences non
supprimées. Comptage par statut via sous-requête ou lateral join.

Règles :
- `applyCenterScope(ctx, ...)` ou filtre manuel `centre_id = centreId`
- `deleted_at IS NULL` sur `session_group` ET sur `occurrence`
- Tri : `prochaineDateAt ASC NULLS LAST`
- Retour typé (type inféré depuis Drizzle, exporté)

**Fonction B : `getSessionGroupDetail(sessionGroupId: string, centreId: string)`**

Retourne null si `session_group.centre_id !== centreId` (isolation tenant).

Structure retournée :
session_group : { id, nom, centreId }
workshop : { nom, dureeMinutes }
workshopType : { nom }
occurrences : [
{
id, index, startAt, endAt, lieu, salle, notes, statut,
ticket : {
id, statut,
slots : [
{
id, providerRole, statut, sentAt, respondedAt,
provider : { id, nom, prenom, ville } | null
}
]
} | null
}
]

Règles :
- `deleted_at IS NULL` sur toutes les tables
- Occurrences triées par `index ASC`
- Slots triés par `ordre ASC` (ou `created_at` si pas de colonne ordre)

Affiche le fichier session-group.ts COMPLET après ajout (fonctions S8
existantes + nouvelles). STOP → GO avant écriture.

### 1.2 Créer `server/queries/ticket-slot.ts`

Ce fichier contient UNIQUEMENT des fonctions de lecture pour cette phase.

**Fonction : `getProvidersForSlot(slotId: string, centreId: string)`**

Retourne les prestataires éligibles pour un slot donné.

Join path à utiliser (confirmé en 0.3) :
`ticket_slot → ticket → occurrence → session_group → workshop → project
→ provider_assignment → provider`

Filtre : `provider_assignment.project_id = workshop.project_id`
(les prestataires affectés au projet de l'atelier de cette session)

Et : `session_group.centre_id = centreId` (isolation tenant)
Et : `provider_assignment.deleted_at IS NULL`
Et : `provider.deleted_at IS NULL`

Retourne : `{ id, nom, prenom, ville, metier }[]`
Trié par `nom ASC`.

**Important** : si aucun prestataire n'est affecté au projet
(provider_assignment vide pour ce project_id), retourne `[]` sans erreur.
L'UI affichera "Aucun prestataire affecté à ce projet".

Affiche le fichier complet. STOP → GO avant écriture.

### 1.3 tsc --noEmit

`pnpm tsc --noEmit`
Affiche sortie brute. STOP si erreurs.

### GATE 1 → STOP

Attends GO explicite avant Phase 2.

---

## Phase 2 — Logique de mutation ticket_slot

**Décision d'architecture** : la logique de transition de statut réside dans
`server/mutations/ticket-slot.ts` (PAS dans `queries/`). Ce fichier exporte
une fonction utilisée par les server actions. Les server actions restent le
seul point d'entrée exposé au client.

### 2.1 Créer `server/mutations/ticket-slot.ts`

Affiche le fichier complet avant écriture. STOP → GO.

**Fonction : `updateTicketSlotStatut(params, ctx)`**

```typescript
params: {
  slotId: string
  newStatut: TicketSlotStatut
  providerId?: string   // requis pour empty → pending
  raison?: string       // requis pour confirmed → cancelled (hors scope S9)
}
ctx: ServerContext
```

Comportement :
1. Récupère le slot en DB. Si absent ou `deleted_at IS NULL` manquant → throw.
2. Vérifie que `session_group.centre_id = ctx.centreId` (isolation tenant).
3. Vérifie la transition autorisée selon la table ci-dessous.
   Si transition interdite → throw `Error('Transition interdite : X → Y')`.
4. Prépare les champs à mettre à jour selon la transition :
   - `empty → pending` : `provider_id = providerId`, `sent_at = now()`, `statut = 'pending'`
   - `pending → empty` : `provider_id = NULL`, `statut = 'empty'`.
     **`sent_at EST CONSERVÉ (ne pas écraser)`**
   - `empty → skipped` : `statut = 'skipped'`
   - `refused → skipped` : `statut = 'skipped'`
   - `pending → skipped` : `provider_id = NULL`, `statut = 'skipped'`
     (la demande en cours est annulée avant le skip)
5. En UNE transaction :
   a. UPDATE `ticket_slot`
   b. Appelle `recomputeOccurrenceStatut(occurrenceId, tx)`
   c. Appelle `logAudit(ctx, 'update_statut', 'ticket_slot', slotId,
      { statut: ancienStatut }, { statut: newStatut })`
6. Retour typé : le slot mis à jour.

**Table des transitions autorisées en S9 (acteur: referent) :**

| De | Vers | Conditions |
|---|---|---|
| `empty` | `pending` | `providerId` obligatoire |
| `pending` | `empty` | `sent_at` conservé |
| `empty` | `skipped` | — |
| `refused` | `skipped` | — |
| `pending` | `skipped` | vide `provider_id` |

**Transitions interdites (toutes les autres) → throw.**
En particulier : `skipped → *` (terminal), `confirmed → *` (hors S9),
`done → *` (terminal), `cancelled → *` (terminal).

**Fonction : `recomputeOccurrenceStatut(occurrenceId: string, tx)`**

Doit être appelée dans la même transaction (paramètre `tx` Drizzle obligatoire).

Logique de dérivation (ordre strict) :
1. Si `occurrence.statut = 'cancelled'` → ne rien faire (statut figé).
2. Récupère tous les `ticket_slot` non supprimés de l'occurrence
   (via `ticket → occurrence`).
3. Slots actifs = slots où `statut NOT IN ('skipped', 'cancelled')`.
4. Si tous actifs sont `done` → `occurrence.statut = 'completed'`
5. Sinon si tous actifs sont `confirmed` ou `done` → `'confirmed'`
6. Sinon → `'planned'`
7. UPDATE `occurrence.statut` dans la transaction.

Règle : si aucun slot actif (tous skipped ou cancelled), statut reste `planned`.

Affiche le fichier complet. STOP → GO avant écriture.

### 2.2 tsc --noEmit

`pnpm tsc --noEmit`
Affiche sortie brute. STOP si erreurs.

### GATE 2 → STOP

Attends GO explicite avant Phase 3.

---

## Phase 3 — Validations Zod

Crée `server/validations/ticket-slot.ts`.

Affiche le fichier complet avant écriture. STOP → GO.

**`AssignProviderSchema`**
- `slotId` : uuid
- `providerId` : uuid

**`CancelRequestSchema`**
- `slotId` : uuid

**`SkipSlotSchema`**
- `slotId` : uuid

Exporter tous les types inférés.

`pnpm tsc --noEmit` après écriture. Sortie brute. STOP → GO.

---

## Phase 4 — Server actions

Crée `app/app/sessions/[id]/session.actions.ts`.

Affiche le fichier complet avant écriture. STOP → GO.

Chaque action : `requireRole('referent')` en tête.

**`assignProviderToSlot(input)`**
- Parse `AssignProviderSchema`
- Appelle `updateTicketSlotStatut({ slotId, newStatut: 'pending', providerId }, ctx)`
- `revalidatePath('/app/sessions/[id]')` avec l'id réel du session_group
- Retour typé

**`cancelSlotRequest(input)`**
- Parse `CancelRequestSchema`
- Appelle `updateTicketSlotStatut({ slotId, newStatut: 'empty' }, ctx)`
- `sent_at` conservé automatiquement par `updateTicketSlotStatut`
- `revalidatePath`

**`skipSlot(input)`**
- Parse `SkipSlotSchema`
- Lit le statut actuel du slot en DB (ne pas faire confiance au client)
- Si statut actuel non dans `['empty', 'refused', 'pending']` → throw
- Appelle `updateTicketSlotStatut({ slotId, newStatut: 'skipped' }, ctx)`
- `revalidatePath`

Règles communes :
- `requireRole('referent')` en tête
- Aucun `any`, retours typés
- Toute mutation passe par `updateTicketSlotStatut` — AUCUNE UPDATE directe

`pnpm tsc --noEmit` après écriture. Sortie brute. STOP → GO.

### GATE 4 → STOP

Attends GO explicite avant Phase 5.

---

## Phase 5 — UI

Installe les shadcn manquants identifiés en Phase 0 avant d'écrire.
Affiche sortie brute installation. STOP → GO.

Crée les fichiers un par un dans l'ordre. Pour chaque fichier :
affiche le contenu complet → STOP → GO → écris.

### 5.1 `app/app/page.tsx` — Liste sessions

Server Component async.
`requireRole('referent')`.
Appelle `listSessionGroupsForCentre(ctx.centreId)`.
Passe les données à `<SessionsListClient />`.

Crée `app/app/sessions-list-client.tsx` ("use client") :
- Liste de cards, une par `session_group`
- Chaque card : nom groupe, nom workshop, nom type, date prochaine occurrence
  (formatée wall-clock `America/Guadeloupe`, ex. "Mer. 11 juin 2025 · 14h00")
- Badge statut agrégé : si au moins un `refused` → badge rouge "À débloquer",
  sinon si au moins un `empty` → badge orange "En attente", sinon badge vert "Complet"
- Lien vers `/app/sessions/[id]`
- Si aucune session : message "Aucune session créée — commencez par
  créer une nouvelle séance."

### 5.2 `app/app/sessions/[id]/page.tsx` — Détail session

Server Component async.
`requireRole('referent')`.
Lit `params.id`.
Appelle `getSessionGroupDetail(params.id, ctx.centreId)`.
Si null → `notFound()`.
Passe les données à `<SessionDetailClient />`.

### 5.3 `app/app/sessions/[id]/session-detail-client.tsx`

"use client".

Affiche :
- Header : nom session + nom workshop + nom type
- Pour chaque occurrence, une carte :
  - Date/heure (wall-clock) + index (S1, S2…)
  - Badge statut occurrence
  - Pour chaque ticket_slot de l'occurrence :
    - Rôle (`provider_role`, en uppercase)
    - Badge statut slot (coloré : empty=gris, pending=jaune, confirmed=vert,
      refused=rouge, skipped=slate, cancelled=stone)
    - Si slot statut = `empty` :
      - Appelle `getProvidersForSlot` via une Server Action dédiée (voir 5.4)
        ou reçoit les providers en props depuis la page serveur
      - Select prestataires + bouton "Assigner"
      - Si liste vide : texte "Aucun prestataire affecté à ce projet"
    - Si slot statut = `pending` :
      - Nom du prestataire assigné
      - Bouton "Annuler la demande"
    - Si slot statut = `refused` :
      - Nom du prestataire qui a refusé
      - Bouton "Passer en skipped"
    - Si slot statut = `skipped` : texte "Non requis"
    - Si slot statut = `confirmed` : nom prestataire, pas d'action en S9

**Décision à prendre avant écriture** : les providers éligibles
pour chaque slot sont-ils chargés côté serveur dans `page.tsx` (1 query
par slot au chargement) ou chargés à la demande via Server Action au clic
sur "Assigner" ? Recommande l'approche la plus simple pour V1 et justifie
en 1 phrase. STOP → attends ma validation sur ce point.

### 5.4 `scripts/check-session.ts`

Script de vérification post-S9 à créer dans `scripts/`.

Affiche pour un `session_group_id` passé en arg :
- Détail session_group
- Occurrences avec leur statut
- Pour chaque occurrence : tickets + ticket_slots avec statuts et provider_id

Utilisation :
`pnpm tsx --env-file=.env.local scripts/check-session.ts <session_group_id>`

Affiche le contenu complet. STOP → GO avant écriture.

`pnpm tsc --noEmit` après chaque fichier UI. Sortie brute. STOP si erreurs.

### GATE 5 → STOP

Attends GO avant Phase 6.

---

## Phase 6 — Vérifications finales

### 6.1 tsc --noEmit final

`pnpm tsc --noEmit`
Affiche sortie brute. STOP si erreurs.

### 6.2 Test manuel guidé

Donne les étapes exactes :
1. Login référent → `/app` : les sessions créées en S8 sont visibles
2. Clic sur une session → détail avec occurrences et slots
3. Sur un slot `empty` : sélectionner un prestataire → Assigner
4. Vérifier en DB avec `scripts/check-session.ts` :
   - `ticket_slot.statut = 'pending'`
   - `ticket_slot.provider_id` rempli
   - `ticket_slot.sent_at` rempli
   - `occurrence.statut` recalculé
   - Entrée dans `audit_log` présente
5. Annuler la demande → statut repasse à `empty`
6. Vérifier en DB : `provider_id = NULL`, `sent_at` CONSERVÉ
7. Sur un slot `empty` : action skip → statut `skipped`
8. Vérifier que `occurrence.statut` est recalculé à chaque mutation
9. Tenter une transition interdite (ex. skip d'un slot `confirmed`) :
   doit retourner une erreur sans modifier la DB

### 6.3 Récapitulatif final

Liste :
- Fichiers créés (chemins exacts)
- Fichiers modifiés (chemins + nature de la modification)
- Décisions prises sans consultation
- Dettes / TODO laissés dans le code
- Blockers découverts

### GATE FINAL → STOP

Attends validation manuelle avant commit Git.

---

## Règles transverses (rappel)

- Une action irréversible à la fois
- Sortie brute obligatoire après chaque commande
- Pas de `pnpm build`
- Pas de `drizzle-kit push` ni `drizzle-kit migrate`
- Pas de DELETE physique en DB
- Vérifications DB : scripts tsx avec `dotenv .env.local`
- Anti-invention protocol : lire avant écrire, prouver par exécution
- En cas de doute ou de conflit avec une décision existante : STOP et signale
- Toute mutation `ticket_slot.statut` passe UNIQUEMENT par
  `updateTicketSlotStatut` dans `server/mutations/ticket-slot.ts`.
  Aucune UPDATE directe autorisée.

## Fin du brief

Trois ajouts structurels clés par rapport au plan original :

Phase 0 renforcée : vérification du join path complet en 0.3 (6 tables, FKs confirmées avant d'écrire une seule query).
Gate sur le choix de chargement des providers (step 5.3) : c'est une décision d'architecture que Claude Code ne doit pas prendre seul — charge à la page ou à la demande ? Je l'ai bloquée avec un STOP explicite.
server/mutations/ clarifié dans les règles transverses : la séparation queries (SELECT) / mutations (UPDATE + transaction) est rendue explicite et non contournable.