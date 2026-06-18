# Architecture SaaS Booking

## Structure projet

```
/app                          → Routes Next.js, UI uniquement, JAMAIS SQL
  /(admin)                    → Espace super_admin + project_admin
    /centers, /projects, /metiers, /providers, /users, /workshops, /export
  /(app)                      → Espace référent
    /sessions, /availability, /calendar, /providers
  /(pro)                      → Espace prestataire
    /missions, /dispos, /profile
  /login, /dev-login (⚠️ désactiver prod), /account, /setup-password
  /api/auth/[...all]          → Better Auth handler
/server                       → Toute logique métier
  /db
    /schema                   → Schémas Drizzle par domaine (20 tables)
    /client.ts                → Client Drizzle + Neon
    /migrations               → SQL généré drizzle-kit
  /auth/config.ts             → Config Better Auth
  /context/server-context.ts  → ServerContext {userId, centreId, role}
  /queries                    → Lecture DB
  /mutations                  → Écriture DB
  /validations                → Schémas Zod par domaine
  /lib                        → email, errors, utils
/scripts                      → Scripts tsx one-off (non commités)
```

---

## Rôles (4 fixes)

| Rôle | Périmètre | Bypass centre_id | Espace |
|------|-----------|------------------|--------|
| super_admin | Tout | Oui | /admin |
| project_admin | 1 centre | Non | /admin |
| referent | 1 centre | Non | /app |
| provider | Global (pas de centre) | Non | /pro |

---

## Multi-tenant (isolation applicative)

**Principe :** `centre_id` sur toutes les tables métier sauf `provider`, `metier`, `audit_log` (nullable).

**Implémentation :**
- `applyCenterScope(ctx, query)` gère bypass super_admin
- `ServerContext` centralisé — JAMAIS `centre_id` du client
- Pas de RLS Postgres V1 (V2 si besoin)

**Provider :** pas de `centre_id` — global en V1 (BDR-017, territoire Guadeloupe)

---

## Modèle données (hiérarchie)

```
Centre ←── project_centre ──→ Project → Workshop → SessionGroup → Occurrence → Ticket → TicketSlot
                                         Workshop.centreId nullable (catalogue global admin, BDR-022)
                                                              Occurrence.startAt/endAt nullable (dates fixées après création)
```

Un projet peut concerner N centres via `project_centre` (BDR-024). `project.centreId` reste nullable (traçabilité centre initiateur).

### Tables schema (21)

**Auth (Better Auth) :** user (étendu), session, account, verification

**Référentiels :** centre, metier, workshop_type, workshop_role_group, workshop_role_slot

**Instances :** project, project_centre, workshop, session_group, occurrence, ticket, ticket_slot

**Prestataires :** provider, provider_assignment, provider_availability

**Transverses :** audit_log, user_invitation

---

## Points clés V1 vs spec initiale

| Sujet | État V1 |
|-------|---------|
| `workshop.centreId` | NULLABLE — catalogue global admin (BDR-022) |
| `occurrence.startAt/endAt` | NULLABLE — fixées lors sélection dispo (BDR-015) |
| Couleur slot | Sur `metier.color`, pas sur `workshop_role_slot` |
| `provider.userId` | UNIQUE FK → user (BDR-010) |
| `provider_availability.kind` | `available \| unavailable` (exceptions horaires) |
| Granularité dispo | 30 minutes |
| `provider_role` table | SUPPRIMÉE — remplacée par `workshop_role_slot` + `metier` |
| `getProvidersForSlot` | Filtre metier_id + availability, pas provider_assignment (BDR-009) |

---

## Règles techniques

| Aspect | Choix |
|--------|-------|
| id | uuid Postgres (`gen_random_uuid()`) |
| Timestamps | TIMESTAMPTZ, stockés UTC, affichés timezone centre |
| Timezone défaut | America/Guadeloupe |
| Soft delete | `deleted_at` nullable timestamptz sur toutes tables métier |
| Cascade delete | Non (protection données), sauf auth (Better Auth) et occurrence→ticket |

---

## Auth

**V1 :** Magic link uniquement (Resend)

**Flow :**
1. User entre email sur `/login`
2. Better Auth envoie magic link
3. Click link → session créée DB
4. Hook signIn : refuser si `user.deleted_at IS NOT NULL`
5. Dispatch selon rôle : super_admin/project_admin → `/admin`, referent → `/app`, provider → `/pro`

**Invitation :** admin crée compte via `user_invitation` (token unique, expiration)

**Password :** vestige dev local uniquement (`password_set`). Désactiver avant prod (BLK-011 : `/dev-login` route encore présente).

---

## Migrations

| Étape | Commande | Où |
|-------|----------|-----|
| Générer SQL | `drizzle-kit generate` | Local |
| Commit SQL | git | Repo |
| Appliquer dev | `npm run db:migrate` | Local → Neon dev branch |
| Appliquer prod | `npm run db:migrate` | Terminal local → Neon prod |

**Build Render :** `npm ci && npm run build` UNIQUEMENT. Jamais migration dans build.

**DETTE-DB-001 :** migration id=9 créée hors drizzle-kit, pas de fichier SQL local — à résoudre avant prod.
