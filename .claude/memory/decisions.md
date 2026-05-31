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
| BDR-005 | 2026-05-11 | Auth flow | Magic link uniquement V1 |

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
- **Decision**: Magic link uniquement via Resend. Email+password activé temporairement pour dev local uniquement.
- **Why**: Zéro mot de passe oublié, zéro reset flow à gérer. Cible (centres sociaux) pas d'habitude SaaS — magic link plus simple.
- **Alternatives**:
  - Password: activable V1.5 si demande utilisateur
- **Status**: active
- **Note**: [app/login/page.tsx](app/login/page.tsx) implémente actuellement email+password — À corriger avant livraison V1
