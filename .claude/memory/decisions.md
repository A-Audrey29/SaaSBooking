# Decisions Registry

Schema:
- ID: Unique identifier (BDR-XXX)
- Date: YYYY-MM-DD
- Title: Short decision title
- Decision: What was decided
- Why: Rationale
- Alternatives: Other options considered
- Status: active | deprecated | superseded

---

## Index

| ID | Date | Domaine | Décision |
|----|------|---------|----------|
| BDR-001 | 2026-05-11 | Auth | Better Auth (magic link V1) |
| BDR-002 | 2026-05-11 | DB/ORM | Neon + Drizzle |
| BDR-003 | 2026-05-11 | Hosting | Render (pas Vercel) |
| BDR-004 | 2026-05-11 | Multi-tenant | Isolation applicative centre_id (pas RLS) |
| BDR-005 | 2026-05-11 | Auth flow | Magic link uniquement V1 — résolu 2026-06-03 |
| BDR-006 | 2026-06-01 | Contraintes DB | Stratégie contraintes rôles provider (V1 vs V2) |
| BDR-007 | 2026-06-03 | Sécurité | dev-login route à supprimer avant prod |
| DETTE-DB-001 | 2026-06-04 | DB/Migrations | __drizzle_migrations id=9 sans fichier SQL local — tables group/slot créées hors migration |
| BDR-008 | 2026-06-04 | Availability | Chevauchement dispos non contraint en V1 |
| BDR-009 | 2026-06-04 | Availability | getProvidersForSlot : scope métier+dispo, providerAssignment retiré |
| BDR-010 | 2026-06-04 | Provider | Lien provider↔user via userId FK UNIQUE sur provider |
| BDR-011 | 2026-06-09 | Users | Filtres /admin/users client-side JS (V2 : searchParams server-side) |
| BDR-012 | 2026-06-09 | Provider | Documents prestataire exclus V1 — prévu V1.5 (table provider_documents) |
| BDR-013 | 2026-06-09 | Provider | Profil prestataire : téléphone/ville/bio auto-éditable. nom/email/métier = admin only |
| BDR-014 | 2026-06-09 | Auth | Changement mdp : server action bcrypt (pas Better Auth client) — plus simple, cohérent avec setup-password existant |
| BDR-015 | 2026-06-09 | Sessions | occurrence.startAt/endAt nullable — dates fixées via calendrier dispos |
| BDR-016 | 2026-06-09 | Admin/Workshops | QuickCreate drawer : type + groupe + slots en 1 transaction |

---

## Entries

### BDR-001: Better Auth
- **Date**: 2026-05-11
- **Title**: Auth Strategy
- **Decision**: Better Auth (magic link V1, sessions stockées en DB)
- **Why**: Sécurité plug-and-play, zéro gestion mot de passe, hook signIn pour bloquer deleted_at. Rate limiting inclus.
- **Alternatives**:
  - Clerk/Auth0: coût prohibitif pour subvention FSE
  - Passport.js + JWT: trop manuel, gestion refresh token complexe
  - NextAuth/Auth.js: moins adapté Drizzle + Neon
- **Status**: active

### BDR-002: PostgreSQL on Neon + Drizzle ORM
- **Date**: 2026-05-11
- **Title**: Database + ORM
- **Decision**: Neon plan Launch (~5 $/mois) avec Drizzle ORM + drizzle-kit
- **Why**: Neon serverless driver optimal pour Next.js, Drizzle léger et type-safe, pas de génération de client. Coût maîtrisé pour financement subvention.
- **Alternatives**:
  - Prisma: plus lourd, cold starts plus lents
  - Supabase: plan Pro 25 $/mois trop cher
  - MongoDB: modèle relationnel indispensable pour booking
- **Status**: active

### BDR-003: Render (pas Vercel)
- **Date**: 2026-05-11
- **Title**: Hosting
- **Decision**: Render Web Service
- **Why**: Serveur long-running, pas de complexité serverless. Next.js full-stack tourne en continu. Coût prévisible.
- **Alternatives**:
  - Vercel: écarté — complexité serverless inutile, pricing à l'usage imprévisible
- **Status**: active

### BDR-004: Isolation applicative centre_id (pas RLS)
- **Date**: 2026-05-11
- **Title**: Multi-tenant isolation
- **Decision**: Champ centre_id sur toutes les tables métier + fonction applyCenterScope(). Pas de RLS Postgres en V1.
- **Why**: RLS sur-ingénierie pour V1. 4 rôles fixes suffisent. applyCenterScope() centralise le filtre, super_admin bypass.
- **Alternatives**:
  - RLS Postgres: prévu V2 si besoin, bloqué V1
  - Schéma par tenant: trop complexe
- **Status**: active

### BDR-005: Magic link uniquement en V1
- **Date**: 2026-05-11
- **Title**: V1 auth flow
- **Decision**: Magic link uniquement. Transport = `console.log` en dev (URL dans terminal), Resend en prod.
- **Why**: Zéro mot de passe oublié, zéro reset flow à gérer. Cible (centres sociaux) pas d'habitude SaaS — magic link plus simple.
- **Alternatives**:
  - Password: activable V1.5 si demande utilisateur
- **Status**: active — implémenté 2026-06-03
- **Implémentation**: login page = champ email seul → `authClient.signIn.magicLink()`. `server/auth/config.ts` plugin magicLink avec `sendMagicLink: console.log`. `additionalFields` role + centreId exposés dans session.

### BDR-006: Stratégie contraintes rôles provider (V1 vs V2)
- **Date**: 2026-06-01
- **Title**: Provider roles constraints strategy
- **Decision**: Migration 0002 ajoute contraintes DB selon stratégie différenciée :
  - `user.role` (enum fixe 4 valeurs) : CHECK constraint DB + validation Zod
  - `provider_assignment.role` et `ticket_slot.providerRole` : validation Zod uniquement, pas de CHECK ni FK en V1
  - `provider_role` : UNIQUE (workshop_type_id, role) pour préparer V2
- **Why**:
  - `user.role` = enum fixe code → CHECK safe et utile
  - Rôles provider référencent table extensible `provider_role` (gérée via UI/seed)
  - FK propre vers `provider_role.id` requiert refactor colonnes `text` → `uuid`
  - YAGNI V1 — validation Zod suffit, FK plus tard
  - UNIQUE sur `provider_role` évite doublons, prépare FK V2 proprement
- **Alternatives**:
  - CHECK constraint fixe sur codes rôles provider : rejeté — rigide, contredit table extensible
  - FK immédiate vers `provider_role.id` : rejeté V1 — refactor lourd, pas critique pour MVP
- **V2 prévu**:
  - Refactor `provider_assignment.role` et `ticket_slot.providerRole` vers FK `provider_role.id`
  - Migration data : mapper codes texte → UUID
  - Garantit cohérence référentielle complète
- **Status**: active

### DETTE-DB-001: __drizzle_migrations désynchronisé
- **Date**: 2026-06-04
- **Title**: DB migrations hors drizzle-kit
- **Decision**: Tables `workshop_role_group` et `workshop_role_slot` créées en DB sans fichier SQL correspondant. `__drizzle_migrations` contient id=9 (hash `bfc2d7e09e578df4b56f002759c5090bbb5c871a889da062a257ddab0ca575a4`) absent du journal local (`meta/_journal.json` s'arrête à idx=8).
- **Why**: Migration appliquée hors drizzle-kit (push ou SQL direct) lors de session précédente.
- **Impact**: Pas de blocage dev. Bloquant avant déploiement prod — Render lancera `db:migrate` qui verra une divergence de hash.
- **À faire avant prod**: Script d'initialisation idempotent (`CREATE TABLE IF NOT EXISTS`) ou réconciliation manuelle du journal (`INSERT INTO __drizzle_migrations` avec hash du fichier généré par `drizzle-kit generate`).
- **Status**: active — dette à traiter avant prod

### BDR-008: Chevauchement dispos non contraint en V1
- **Date**: 2026-06-04
- **Title**: provider_availability — overlap constraint
- **Decision**: Pas de CHECK ni contrainte DB sur chevauchement des créneaux de disponibilité en V1.
- **Why**: Spec §5.3 : "non chevauchants recommandés, non contraints en V1". YAGNI — l'UI peut avertir, la DB n'impose rien.
- **V2 prévu**: Exclusion contrainte via EXCLUDE USING gist (tstzrange) si besoin.
- **Status**: active

### BDR-009: getProvidersForSlot — scope métier+dispo, providerAssignment retiré
- **Date**: 2026-06-04
- **Title**: Provider slot filter strategy S10
- **Decision**: `getProvidersForSlot` filtre par `provider.metier_id = workshopRoleSlot.metierId` + `provider_availability` couvrant le créneau. `providerAssignment` n'est plus utilisé comme fence.
- **Why**: Spec §5.3 — le bon prestataire = bon métier + disponible. La notion de projet n'est pas un critère de filtre pour la visibilité des prestataires côté référent.
- **Alternatives**: Garder `providerAssignment` comme fence additionnelle — rejeté, non requis par spec.
- **Status**: active

### BDR-010: Lien provider↔user via userId FK UNIQUE
- **Date**: 2026-06-04
- **Title**: Provider identity resolution
- **Decision**: Ajouter colonne `user_id uuid UNIQUE` FK → `user(id) ON DELETE SET NULL` sur table `provider`. Les mutations Bloc B résolvent `providerId` via `WHERE user_id = ctx.userId AND deleted_at IS NULL`.
- **Why**: `provider.email` n'a pas de UNIQUE constraint → jointure par email unsafe. FK authoritative évite toute ambiguïté et permet de résoudre le providerId depuis le contexte serveur sans passer par le client.
- **Alternatives**: UNIQUE sur `provider.email` — rejeté, email peut changer, moins propre.
- **Status**: active

### BDR-011: Filtres /admin/users client-side
- **Date**: 2026-06-09
- **Title**: Users table filters strategy
- **Decision**: Filtres (recherche texte + rôle) implémentés côté client JS sur données chargées en server component.
- **Why**: Table petite en V1 (< 100 users typiquement). Pas de round-trip serveur, implémentation simple.
- **V2 prévu**: Remplacer par `searchParams` URL + WHERE clause serveur si table dépasse 500 lignes.
- **Status**: active

### BDR-012: Documents prestataire exclus V1
- **Date**: 2026-06-09
- **Title**: Provider documents — V1 exclusion
- **Decision**: Pas de table `provider_documents` en V1. Section documents absente de `/pro/profile`.
- **Why**: YAGNI — fonctionnalité non critique MVP. Complexité : upload fichiers, validation admin, stockage S3/Supabase Storage.
- **V1.5 prévu**: Table `provider_documents` (id, provider_id, nom, type, url, statut, uploaded_at, validated_at).
- **Status**: active

### BDR-013: Profil prestataire — édition partielle
- **Date**: 2026-06-09
- **Title**: Provider self-edit scope
- **Decision**: Le prestataire peut modifier téléphone, ville, bio. Nom, email, métier = lecture seule (admin only via /admin/providers).
- **Why**: Données contractuelles (nom, email) ne doivent pas changer sans validation admin. Coordonnées de contact = données opérationnelles légitimes à auto-éditer.
- **Status**: active

### BDR-014: Changement de mot de passe — server action bcrypt
- **Date**: 2026-06-09
- **Title**: Password change implementation
- **Decision**: Server action `changePassword` : vérification bcrypt du mot de passe actuel + update `account.password`. Pas de passage par Better Auth client changePassword.
- **Why**: Plus simple, cohérent avec `setupPassword` existant. Better Auth `emailAndPassword` activé mais pas d'endpoint `/change-password` exposé côté client dans la config actuelle.
- **Status**: active

### BDR-015: occurrence.startAt/endAt nullable
- **Date**: 2026-06-09
- **Title**: Dates occurrence fixées via calendrier dispos, pas à la création
- **Decision**: `occurrence.start_at` et `end_at` passent nullable (migration 0014). Le wizard "nouvelle séance" crée N occurrences sans dates. Les dates sont fixées ultérieurement lors du choix des disponibilités prestataires sur le calendrier.
- **Why**: Séquence métier correcte — on ne peut pas connaître les dates avant d'avoir identifié les créneaux disponibles des prestataires. Forcer les dates à la création était du sens métier inversé.
- **Alternatives**: Valeur sentinelle (1970-01-01) — rejeté, dette technique visible.
- **Status**: active

### BDR-016: QuickCreate drawer — type + groupe + slots en 1 transaction
- **Date**: 2026-06-09
- **Title**: Workshop type creation UX
- **Decision**: Drawer "Nouvel atelier" crée en une transaction atomique : `workshopType` + `workshopRoleGroup` ("Configuration standard") + N `workshopRoleSlot` (chips métiers cliquables). L'UI tree existante reste pour édition fine post-création.
- **Why**: La création via 3 sheets séparés (type → groupe → slot) était trop lente pour usage quotidien. Transaction garantit cohérence — pas de type orphelin sans groupe.
- **Alternatives**: Refonte complète de l'UI tree — rejeté, trop de travail pour V1. Mode avancé séparé — rejeté, inutile car le drawer couvre 100% des cas V1.
- **Status**: active

### BDR-007: dev-login route à supprimer avant prod
- **Date**: 2026-06-03
- **Title**: Sécurité — route dev
- **Decision**: Route `/dev-login` identifiée dans le build. Doit être supprimée avant tout déploiement prod.
- **Why**: Contournement auth en dev — exposition en prod = faille critique.
- **Status**: active — à exécuter en Session 3 avant déploiement
