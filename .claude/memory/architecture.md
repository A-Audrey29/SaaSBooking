# Architecture SaaS Booking

## Structure projet

```
/app                          → Routes Next.js, UI uniquement, JAMAIS SQL
  /(admin)                    → Espace super_admin + project_admin
  /(app)                      → Espace référent
  /(pro)                      → Espace prestataire
  /api/auth/[...all]          → Better Auth handler
/server                       → Toute logique métier
  /db
    /schema                   → Schémas Drizzle par domaine
    /client.ts                → Client Drizzle + Neon
    /migrations               → SQL généré drizzle-kit
  /auth/config.ts             → Config Better Auth
  /context/server-context.ts  → ServerContext {user_id, centre_id, role}
  /services                   → Logique métier (usage progressif)
  /repositories               → Accès DB + filtre centre_id
  /lib                        → email, errors, utils
/scripts
  /migrate.ts                 → Application migrations (séparé build)
  /seed.ts                    → Seed dev
```

---

## Rôles (4 fixes)

| Rôle | Périmètre | Bypass centre_id |
|------|-----------|------------------|
| super_admin | Tout | Oui |
| project_admin | 1 centre | Non |
| referent | 1 centre | Non |
| provider | Multi-centres | Non |

---

## Multi-tenant (isolation applicative)

**Principe:** Champ `centre_id` sur TOUTES tables métier

**Implémentation:**
- Fonction `applyCenterScope(ctx, query)` gère bypass super_admin
- `ServerContext` centralisé, JAMAIS `centre_id` du client
- Index sur `centre_id` partout (perfs critiques)
- **Pas RLS Postgres V1** (V2 si besoin)

---

## Modèle données (hiérarchie)

```
Centre → Project → Workshop → Session → Occurrence → Ticket → TicketSlot
```

### Tables principales

**Auth (Better Auth):**
- user (étendu: centre_id, role)
- session
- account
- verification

**Core métier:**
- centre (tenant)
- project
- workshop_type (référentiel 11 types fixes)
- workshop
- provider_role (pivot rôles/workshop_type)
- provider
- provider_assignment (junction provider/project, soft-delete)
- session_group
- occurrence
- ticket
- ticket_slot
- audit_log (vide V1, écritures V1.5)

---

## Règles techniques

| Aspect | Choix |
|--------|-------|
| id | uuid Postgres (`gen_random_uuid()`) |
| Timestamps | TIMESTAMPTZ, stockés UTC, affichés timezone centre |
| Timezone défaut | America/Guadeloupe |
| Soft delete | `deleted_at` nullable timestamptz sur toutes tables métier |
| Cascade delete | Non (protection données) |

---

## Auth

**V1:** Magic link uniquement (Resend)

**Flow:**
1. User entre email sur `/login`
2. Better Auth envoie magic link
3. Click link → session créée DB
4. Hook signIn: refuser si `user.deleted_at IS NOT NULL`
5. Dispatch selon rôle:
   - super_admin / project_admin → `/admin`
   - referent → `/app`
   - provider → `/pro`

**Password:** Temporaire dev local uniquement. À désactiver avant V1 prod.

---

## Migrations

| Étape | Commande | Où |
|-------|----------|-----|
| Générer SQL | `drizzle-kit generate` | Local |
| Commit SQL | git | Repo |
| Appliquer dev | `npm run db:migrate` | Local → Neon dev branch |
| Appliquer prod | `npm run db:migrate` | Local → Neon prod OU Render Job |

**Build Render:** `npm ci && npm run build` UNIQUEMENT. Jamais migration dans build.

**Migration prod:** Terminal local pointé sur DB prod, ou Render Job dédié.
