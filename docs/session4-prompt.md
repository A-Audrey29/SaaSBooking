# Session 4 — Workshops CRUD + Migration schéma

## Contexte projet

Asanblé — plateforme SaaS B2B de coordination d'ateliers entre centres
sociaux et prestataires. Stack : Next.js 15 App Router, TypeScript,
Drizzle ORM, Neon Postgres, Better Auth, shadcn/ui, RHF + Zod, Resend.

**Lis CLAUDE.md AVANT toute action.** Les règles de gouvernance sont
non négociables : une action irréversible à la fois, sortie brute
obligatoire, GO explicite entre chaque gate.

---

## État entrant Session 4

Sessions précédentes complètes et commitées :
- Migrations 0001→0008 appliquées en DB dev Neon
- CRUD Centres ✅ (app/admin/centers/)
- CRUD Users + invitation flow ✅ (app/admin/users/)
- Auth : Better Auth, email+password, disableSignUp: true
- Pattern server action établi :
  requireRole → Zod → transaction Drizzle → logAudit → revalidatePath
- Helpers disponibles :
  - server/context/server-context.ts : requireRole(), applyCenterScope()
  - server/queries/audit.ts : logAudit()
- tsc vert au commit précédent

---

## Objectif Session 4

**Deux blocs dans l'ordre strict :**

1. Migration schéma DB (workshop_role_group, workshop_role_slot,
   colonnes manquantes, migration données provider_role, seed)
2. CRUD Workshops admin (workshop_type + groupes + slots imbriqués)

**Hors périmètre Session 4 (ne pas implémenter) :**
- CRUD Projets
- CRUD Prestataires
- Espaces référent /app et prestataire /pro
- Dashboard admin

---

## Terminologie figée (toute divergence = bug)

| Terme DB | Définition |
|---|---|
| workshop_type | Template d'atelier (global si centre_id NULL, propre au centre sinon) |
| workshop_role_group | Groupe de besoins — le OU est entre groupes |
| workshop_role_slot | Un besoin individuel (1 rôle, 1 personne, optionnel ou requis) |
| workshop | Atelier concret rattaché à un project |
| provider_role | TABLE À SUPPRIMER — remplacée par group + slot |

---

## Phase 0 — Vérifications préalables OBLIGATOIRES

Avant d'écrire la moindre ligne de code, effectue ces vérifications
et restitue les sorties brutes dans un seul message.

### 0.1 Lire le schéma actuel complet

Lis tous les fichiers dans server/db/schema/*.ts.
Pour chaque table, confirme :
- Colonnes présentes
- Types exacts
- FKs et onDelete policies

Produis un tableau : table | colonnes clés | FKs

### 0.2 Vérifier l'état actuel de provider_role

Lance un script tsx qui compte les lignes dans provider_role
et affiche leur contenu brut.
Commande : pnpm tsx -e "..." avec dotenv .env.local

### 0.3 Vérifier workshop_type actuel

Même vérification : compter les lignes, afficher contenu brut.
Confirmer présence ou absence de : centre_id, deleted_at.

### 0.4 Vérifier occurrence actuel

Confirmer présence ou absence de : workshop_role_group_id.

### 0.5 Vérifier ticket_slot actuel

Confirmer présence ou absence de : workshop_role_slot_id.

### 0.6 Lister les migrations existantes

pnpm tsx scripts/migrate.ts --list (ou équivalent)
Afficher le numéro de la dernière migration appliquée.

### 0.7 Vérifier shadcn components disponibles

ls components/ui/ | sort
Identifier les manquants pour cette session :
- Checkbox (pour les slots optionnels)
- Tabs (si nécessaire pour groupes)
- Textarea (pour description)
Signaler les manquants.

### 0.8 tsc --noEmit

pnpm tsc --noEmit
Affiche sortie brute. Si erreurs : STOP, signale, attends instruction.

### GATE 0 → STOP

Restitue tout dans un seul message structuré.
Attends GO explicite avant Phase 1.

---

## Phase 1 — Migration schéma (0009)

Ordre strict : proposer → GO → générer → GO → appliquer → GO.

### 1.1 Proposer le schéma Drizzle TypeScript

Propose les modifications suivantes en TypeScript uniquement.
Pas de génération encore.

**A. workshop_type — ajouter 2 colonnes**
- centreId : uuid nullable, FK → centre.id onDelete set null
- deletedAt : timestamp tz nullable

**B. workshop_role_group — NOUVELLE TABLE**
- id : uuid PK defaultRandom
- workshopTypeId : uuid notNull FK → workshop_type.id onDelete cascade
- label : text notNull
- ordre : integer notNull default 0
- createdAt, updatedAt : timestamp tz notNull defaultNow
- deletedAt : timestamp tz nullable

**C. workshop_role_slot — NOUVELLE TABLE**
- id : uuid PK defaultRandom
- workshopRoleGroupId : uuid notNull FK → workshop_role_group.id onDelete cascade
- role : text notNull
- couleur : text nullable (hex)
- isOptional : boolean notNull default false
- ordre : integer notNull default 0
- createdAt, updatedAt : timestamp tz notNull defaultNow
- deletedAt : timestamp tz nullable

**D. occurrence — ajouter 1 colonne**
- workshopRoleGroupId : uuid nullable FK → workshop_role_group.id
  onDelete set null (PAS cascade — une occurrence garde sa trace
  même si le groupe template est supprimé)

**E. ticket_slot — ajouter 1 colonne**
- workshopRoleSlotId : uuid nullable
  PAS de FK stricte (pas de references(), pas de cascade)
  Raison : traçabilité uniquement, le slot template peut être supprimé

Règles :
- Tous timestamps : withTimezone: true, mode: "date"
- Noms SQL snake_case, noms Drizzle camelCase
- Exporter les nouvelles tables dans server/db/schema/index.ts

Affiche le TypeScript complet pour chaque fichier modifié.
STOP → GO avant génération.

### 1.2 Générer la migration

pnpm drizzle-kit generate
Affiche le SQL brut intégral.
Vérifie que le SQL correspond exactement à 1.1.
STOP → GO avant application.

### 1.3 Appliquer la migration

pnpm db:migrate (via tsx scripts/migrate.ts)
Affiche sortie brute.

Vérification post-migration via script tsx :
- workshop_type : colonnes centre_id et deleted_at présentes
- workshop_role_group : table créée, 6 colonnes
- workshop_role_slot : table créée, 7 colonnes
- occurrence : colonne workshop_role_group_id présente
- ticket_slot : colonne workshop_role_slot_id présente

Affiche sortie brute du script. STOP → GO avant Phase 2.

---

## Phase 2 — Migration données provider_role

Cette phase migre les données existantes et supprime provider_role.

### 2.1 Script de migration données (proposer seulement)

Propose un script tsx server/scripts/migrate-provider-role.ts qui :

1. Lit toutes les lignes de provider_role avec leur workshop_type_id
2. Pour chaque workshop_type_id distinct :
   - Crée 1 workshop_role_group :
     label = "Configuration par défaut"
     ordre = 0
3. Pour chaque ligne provider_role :
   - Crée 1 workshop_role_slot dans le groupe correspondant :
     role = provider_role.role (ou champ équivalent — vérifier en 0.1)
     couleur = provider_role.couleur (si présent)
     isOptional = false
     ordre = index dans le groupe
4. Log les counts avant/après
5. NE PAS supprimer provider_role dans ce script

Affiche le script complet. STOP → GO avant exécution.

### 2.2 Exécuter le script

pnpm tsx --env-file=.env.local server/scripts/migrate-provider-role.ts
Affiche sortie brute intégrale.
Vérifie les counts : N lignes provider_role → N slots créés.
STOP → GO avant suppression.

### 2.3 Migration DROP TABLE provider_role (0010)

Uniquement après validation des counts en 2.2.

Propose le schéma Drizzle pour supprimer provider_role.
Affiche le TypeScript. STOP → GO.

Génère la migration : pnpm drizzle-kit generate
Affiche SQL brut. STOP → GO.

Applique : pnpm db:migrate
Affiche sortie brute. STOP → GO avant Phase 3.

### 2.4 Mettre à jour le seed

Lis scripts/seed.ts.
Supprime toute référence à provider_role.
Ajoute seed pour workshop_role_group + workshop_role_slot
en cohérence avec les workshop_types existants dans le seed.

Affiche le fichier seed modifié complet. STOP → GO.
Après GO : exécute le seed et affiche sortie brute.

---

## Phase 3 — Validations Zod

Crée server/validations/workshop.ts.

Affiche le fichier complet avant écriture. STOP → GO.

Schémas attendus :

**CreateWorkshopTypeSchema**
- centreId : uuid nullable (null = template global)
- code : string min 2 max 50 trim uppercase
- nom : string min 2 max 200 trim
- description : string max 1000 trim optional

**UpdateWorkshopTypeSchema**
- id : uuid required
- Mêmes champs que Create sauf centreId non modifiable

**CreateRoleGroupSchema**
- workshopTypeId : uuid required
- label : string min 2 max 200 trim
- ordre : number int default 0

**UpdateRoleGroupSchema**
- id : uuid required
- label, ordre

**CreateRoleSlotSchema**
- workshopRoleGroupId : uuid required
- role : string min 1 max 100 trim
- couleur : string regex /^#[0-9A-Fa-f]{6}$/ optional nullable
- isOptional : boolean default false
- ordre : number int default 0

**UpdateRoleSlotSchema**
- id : uuid required
- role, couleur, isOptional, ordre

**SoftDeleteSchema** (réutilisable)
- id : uuid required

Exporter tous les types inférés.

pnpm tsc --noEmit après écriture. Sortie brute. STOP → GO.

---

## Phase 4 — Server actions

Crée app/admin/workshops/workshops.actions.ts.

Affiche le fichier complet avant écriture. STOP → GO.

### Actions sur workshop_type (requireRole('super_admin'))

1. createWorkshopType(input)
   - Parse CreateWorkshopTypeSchema
   - Transaction : insert + logAudit('create', 'workshop_type', ...)
   - revalidatePath('/admin/workshops')
   - Retour typé

2. updateWorkshopType(input)
   - Parse UpdateWorkshopTypeSchema
   - Refuser si deletedAt non null
   - Transaction : update + logAudit('update', ...)
   - revalidatePath('/admin/workshops')

3. softDeleteWorkshopType(input)
   - Refuser si des workshop_role_group non supprimés existent
     (bloquer la suppression d'un type qui a des groupes actifs)
   - Transaction : set deletedAt + logAudit('soft_delete', ...)
   - revalidatePath('/admin/workshops')

### Actions sur workshop_role_group (requireRole('super_admin'))

4. createRoleGroup(input)
5. updateRoleGroup(input)
6. softDeleteRoleGroup(input)
   - Refuser si des workshop_role_slot non supprimés existent

### Actions sur workshop_role_slot (requireRole('super_admin'))

7. createRoleSlot(input)
8. updateRoleSlot(input)
9. softDeleteRoleSlot(input)

Règles communes :
- requireRole('super_admin') en tête
- Aucun any, retours typés
- Transaction + logAudit atomiques
- Note : workshop_type, role_group, role_slot ne sont PAS loggés
  dans audit_log selon spec §6.2 — SAUF soft_delete qui l'est.
  Adapter logAudit en conséquence (soft_delete seulement).

pnpm tsc --noEmit après écriture. Sortie brute. STOP → GO.

---

## Phase 5 — UI Admin

Structure fichiers :
  app/admin/workshops/
    page.tsx
    workshops-client.tsx
    workshop-type-form.tsx
    role-group-form.tsx
    role-slot-form.tsx

Installe shadcn manquants identifiés en Phase 0 avant d'écrire.
Affiche sortie brute installation. STOP → GO.

Crée les fichiers un par un dans l'ordre.
Affiche chaque fichier complet avant écriture. STOP → GO.

### 5.1 page.tsx
- Server Component async
- requireRole('super_admin')
- Query workshop_types non supprimés avec :
  - left join centre (nom)
  - sous-query ou join : workshop_role_groups non supprimés
  - sous-sous-query : workshop_role_slots non supprimés par groupe
- Passe données à <WorkshopsClient />

### 5.2 workshops-client.tsx
- "use client"
- Liste des workshop_types avec expand/collapse pour les groupes
- Pour chaque type :
  - Nom, code, centre (ou "Global"), nb de groupes
  - Boutons : Modifier, Supprimer
  - Section expandable : liste des groupes
    - Pour chaque groupe : label, nb slots, Modifier, Supprimer
    - Bouton "+ Ajouter un groupe"
    - Pour chaque slot : role, couleur (dot), optionnel? (badge),
      Modifier, Supprimer
    - Bouton "+ Ajouter un slot" dans chaque groupe
- Bouton "Nouveau type d'atelier" en haut
- AlertDialog pour toutes les suppressions
- useTransition pour les actions async

### 5.3 workshop-type-form.tsx
- RHF + zodResolver(CreateWorkshopTypeSchema | UpdateWorkshopTypeSchema)
- Champ centreId : Select des centres + option "Global (tous centres)"
- En mode edit : centreId non modifiable (affiché en lecture seule)

### 5.4 role-group-form.tsx
- Champs : label, ordre
- workshopTypeId passé en prop (non modifiable)

### 5.5 role-slot-form.tsx
- Champs : role (text input), couleur (color picker ou text hex),
  isOptional (checkbox), ordre
- workshopRoleGroupId passé en prop

pnpm tsc --noEmit après chaque fichier. Sortie brute. STOP → GO.

---

## Phase 6 — Vérifications finales

### 6.1 tsc --noEmit final

pnpm tsc --noEmit
Affiche sortie brute. STOP si erreurs.

### 6.2 Test manuel guidé

Donne les étapes exactes pour tester :
1. Login super_admin → /admin/workshops
2. Créer un workshop_type global (centreId null)
3. Ajouter un groupe "Configuration standard"
4. Ajouter 2 slots dans le groupe (1 requis, 1 optionnel)
5. Modifier le label du groupe
6. Supprimer un slot
7. Tenter de supprimer le groupe avec slots actifs (doit échouer)
8. Supprimer les slots puis supprimer le groupe
9. Créer un workshop_type lié à un centre
10. Vérifier que soft delete du type échoue si groupe actif

### 6.3 Récapitulatif

Liste :
- Fichiers créés (chemins exacts)
- Fichiers modifiés (chemins + nature)
- Migrations appliquées (numéros + changements)
- Décisions prises sans consultation
- Dettes / TODO laissés dans le code
- Blockers découverts

### GATE FINAL → STOP

Attends validation manuelle avant commit Git.

---

## Règles transverses (rappel)

- Une action irréversible à la fois
- Sortie brute obligatoire après chaque commande
- Pas de pnpm build
- Pas de psql direct
- Pas de drizzle-kit push
- Pas de drizzle-kit migrate (utiliser pnpm db:migrate)
- Vérifications DB : scripts tsx avec dotenv .env.local
- Pas d'invention : prouve par lecture ou exécution avant écriture
- En cas de doute ou conflit avec une décision existante : STOP et signale
- Anti-invention protocol actif : lire avant écrire, toujours

## Fin du brief
