# SaaS Booking

## Mission
Plateforme B2B coordination centres sociaux ↔ prestataires pour ateliers multi-séances (Guadeloupe V1, expansion France V2)

## Stack résumé
Next.js 15 + Drizzle + Neon + Better Auth (magic link) + Render | Coût: 12-17 $/mois

## Règles critiques
- Migrations séparées du build Render (`npm run db:migrate` ≠ build)
- ServerContext centralisé `{user_id, centre_id, role}` — JAMAIS centre_id du client
- Structure `/app` (UI) vs `/server` (logique métier) stricte
- 4 rôles fixes: super_admin, project_admin, referent, provider
- Soft delete partout (`deleted_at`), jamais DELETE physique V1
- Pas RLS Postgres V1 — isolation applicative suffit

## Memory
Détails dans `.claude/memory/`:

| Fichier | Contenu |
|---------|---------|
| **stack.md** | Stack détaillée + alternatives rejetées + interdits V1 |
| **architecture.md** | Structure projet, multi-tenant, modèle données, migrations |
| **terminology.md** | Domain FR ↔ EN (centre, workshop, occurrence...) |
| **environment.md** | Env vars + TODO deploy |
| **blockers.md** | BLK-001 à BLK-007 (1 resolved, 6 open) |
| **decisions.md** | BDR-001 à BDR-005 (Better Auth, Neon, Render, multi-tenant) |
| **learnings.md** | LRN-001 à LRN-011 (migrations, drizzle-kit, Neon branches) |

**Consulter AVANT modifications sur:** migrations, auth flow, multi-tenant, workshop_type

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Development Rules
- Branche `feature/` avant coder
- Jamais push direct `main`
- Validation Zod + error handling sur chaque route/action
- Migrations DB réversibles
- MVP first, optimiser plus tard

## Discipline livraison
Avant chaque livraison:
1. `npx tsc --noEmit` + `npm run build` → reporte ✅/❌
2. Liste décisions prises sans demander (ou "aucune")
3. Aucune action irréversible sans build vert + GO Audrey
4. Une seule prochaine action proposée

## Gouvernance
Si changement stack / sur-ingénierie proposé → **"Suis le CLAUDE.md, n'en dévie pas."**

Jamais affirmer sans preuve (read/exec). Si impossible vérifier → dire "à vérifier", pas supposer.
