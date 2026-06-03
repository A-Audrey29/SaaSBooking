# Environment Variables

## Dev (.env.local)

```bash
# Database
DATABASE_URL="postgresql://neondb_owner:npg_yOSkWGhYU2T0@ep-hidden-wildflower-absuyr69-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"   # Neon dev branch

# Auth
BETTER_AUTH_SECRET=             # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000

# Email
RESEND_API_KEY=

# Monitoring
SENTRY_DSN=
```

---

## Prod (Render)

Même variables + vérifier:
- `BETTER_AUTH_SECRET` ≥ 32 chars
- `DATABASE_URL` pointe Neon prod
- `BETTER_AUTH_URL` = URL Render

---

## TODO avant déploiement Render

Warnings build 2026-05-26 (non bloquants dev, à corriger avant prod):

1. **ESLint cassé** — `@eslint/eslintrc` introuvable dans eslint.config.mjs
2. **BETTER_AUTH_SECRET trop court** — générer 32+ chars
3. **Next.js workspace root ambigu** — package-lock.json parasite à ~/
