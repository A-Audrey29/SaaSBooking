# SaaS Booking

Gestion de séances d'ateliers pour centres sociaux.

## Stack

- **Framework**: Next.js 15 App Router + TypeScript
- **DB**: Neon Postgres
- **ORM**: Drizzle ORM
- **Auth**: Better Auth (magic link)
- **UI**: shadcn/ui + Tailwind CSS
- **Email**: Resend
- **Hosting**: Render Web Service

## Développement local

### Prérequis

- Node.js 20+
- pnpm
- Compte Neon avec database créée

### Installation

```bash
# Installer les dépendances
pnpm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos credentials
```

### Variables d'environnement requises

```bash
# Database (Neon)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Better Auth
BETTER_AUTH_SECRET="generate-32-char-random-string"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email (Resend)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# Sentry (optionnel en dev)
# SENTRY_DSN="https://..."

# Environment
NODE_ENV="development"
```

### Scripts

```bash
# Démarrer le dev server
pnpm dev

# Build pour production
pnpm build

# Démarrer en production
pnpm start

# Database
pnpm db:generate  # Générer les migrations
pnpm db:push      # Push le schema (dev uniquement)
pnpm db:migrate   # Appliquer les migrations
pnpm db:studio    # Ouvrir Drizzle Studio
pnpm db:seed      # Peupler la DB avec des données de test
```

### Initialisation de la base de données

```bash
# Push le schema (première fois, dev)
pnpm db:push

# Ou générer et appliquer les migrations (méthode recommandée)
pnpm db:generate
pnpm db:migrate

# Peupler avec des données de test
pnpm db:seed
```

## Architecture

```
├── app/              # Next.js App Router
│   ├── (public)/     # Routes publiques
│   ├── (admin)/      # Espace admin
│   ├── (referent)/   # Espace référent
│   └── (provider)/   # Espace prestataire
├── server/
│   ├── auth/         # Better Auth config
│   ├── db/           # Drizzle schema et client
│   ├── context/      # Server context (auth, center scope)
│   └── lib/          # Utilities, email, errors
├── components/       # Composants React
│   ├── ui/           # shadcn/ui
│   └── shell/        # Layout components
├── lib/              # Client utilities
├── scripts/          # Scripts (migrate, seed)
└── server/db/migrations/ # Fichiers de migration SQL
```

## Multi-tenant

Toutes les tables métier ont un champ `centre_id`. Le contexte serveur applique automatiquement ce filtre :

- `super_admin` : voit tous les centres (pas de filtre)
- Autres rôles : voient uniquement leur centre

Le soft delete via `deleted_at` est appliqué sur toutes les tables métier.

## Rôles

- `super_admin` : Administration globale, voir tout
- `project_admin` : Administration d'un projet
- `referent` : Référent centre social
- `provider` : Prestataire externe

## Déploiement

Le déploiement se fait via Render. Le build n'exécute pas les migrations.

Pour appliquer les migrations en production :

```bash
# Pointer DATABASE_URL vers la DB de prod
DATABASE_URL="postgresql://prod-connection-string" pnpm db:migrate
```
