# Stack SaaS Booking

## Stack figée (non négociable jusqu'à V1)

| Brique | Choix |
|---|---|
| Framework | Next.js 15 App Router + TypeScript (full-stack) |
| DB | Neon Postgres (plan Launch ~5 $/mois) |
| ORM | Drizzle ORM + drizzle-kit |
| Auth | Better Auth (magic link uniquement V1) |
| UI | shadcn/ui + Tailwind CSS |
| Forms / Validation | React Hook Form + Zod |
| Email | Resend |
| Monitoring | Sentry |
| Hosting | Render Web Service |
| Storage | Cloudflare R2 (si besoin) |

**Coût mensuel V1: 12-17 $/mois**

---

## Alternatives rejetées

| Technologie | Remplacée par | Raison rejet |
|-------------|---------------|--------------|
| Supabase | Neon | Plan Pro 25 $/mois trop cher pour subvention FSE |
| Prisma | Drizzle | Plus lourd, cold starts lents, génération client |
| Vercel | Render | Complexité serverless inutile, pricing imprévisible |
| Fastify backend | Next.js full-stack | Fusion frontend/backend plus simple |
| Auth custom JWT | Better Auth | Sécurité plug-and-play, rate limiting inclus |
| Express | Next.js | Server actions + route handlers suffisent |

---

## Interdit V1 (sur-ingénierie)

- RLS Postgres (isolation applicative suffit)
- Jobs async / Inngest / BullMQ (synchrone OK)
- Permissions granulaires (4 rôles fixes suffisent)
- Rate limiting custom (Better Auth inclut)
- TanStack Query au démarrage (server components d'abord)
- Tests unitaires (V1.5 services critiques)
- Storybook, monorepo, Turborepo
- Backend séparé
- Observabilité business avancée

---

## Critère bascule V1 → V1.5

**Trigger:** 3ème centre social onboardé en prod

**Activer:**
- Écritures audit_log
- Pattern service complet (route → service → repository)
- Monitoring approfondi (slow queries, DB connections)
- Tests unitaires services critiques
- Éventuellement password + magic link

**Pas avant. Aucune négociation.**
