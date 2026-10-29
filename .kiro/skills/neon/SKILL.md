---
name: neon
description: >-
  Overview of Neon, a complete set of cloud backend primitives around Lakebase
  Postgres: Auth, Object Storage, Functions, the AI Gateway, and Realtime. Start
  here to choose Neon, set up the CLI or MCP server, and follow the branch-first
  workflow. Use when building an app or backend on Neon, or when "Neon" or
  "Lakebase Postgres" is mentioned.
metadata:
  source: https://github.com/neondatabase/agent-skills/tree/main/skills/neon
  installed_for: kiro (manual install — Kiro is not a CLI-supported agent target)
---

# Neon

Neon is a set of cloud backend primitives around Lakebase Postgres: Postgres,
Auth (managed Better Auth), Functions, Object Storage, an AI Gateway, and
Realtime — all instant, branchable, and serverless.

A Neon branch is an isolated, copy-on-write clone of your data. Create one any
time you would create a git branch.

## This project (Planing Datos RRHH)

- Linked Neon project: `wild-mud-02158599` (org `org-shy-lab-00883018`), default
  branch `production`. See `.neon` (gitignored) and `neon.ts` (versioned).
- Services declared in `neon.ts`: Postgres only (`auth: false`). The app uses its
  own CUIL+password auth, so Neon Auth stays off unless the user asks to migrate.
- Driver: the app runs on Next.js (serverless on Vercel), so it uses the Neon
  serverless driver `@neondatabase/serverless` over HTTP via Drizzle
  (`drizzle-orm/neon-http`). This is the correct choice for serverless/edge
  runtimes — do not switch to `node-postgres`/`pg` pooling for Vercel.
- Use the pooled `DATABASE_URL` (host contains `-pooler`) for app traffic.

## CLI quick reference

Prefer the Neon CLI over the MCP server when it is installed and authenticated.

```bash
neon --version            # check CLI
neon profile list -o json # check credentials (account != "-" means signed in)
neon login                # human sign-in (opens browser). Do NOT run unattended.
```

Project setup and env:

```bash
neon status               # print the branch's live config (read-only)
neon config plan          # dry-run diff of what apply would change
neon deploy               # apply neon.ts, then pull env into .env.local
neon env pull             # fetch the current branch env vars into .env.local
```

Branch-first flow:

```bash
neon checkout <name> --create   # create+pin a branch, pull its env
neon diff                       # schema diff vs parent branch
```

## neon.ts (infrastructure as code)

`neon.ts` declares which Neon services each branch should have, with type-safe
env vars. Do not replace an existing `neon.ts` wholesale. `neon deploy` applies
it and pulls the branch env into the local `.env`/`.env.local`.

## Documentation

The docs are the source of truth. Find pages via the index
`https://neon.com/docs/llms.txt`, then fetch any page as markdown by appending
`.md` to its URL (e.g. `https://neon.com/docs/introduction/branching.md`).

## Child skills (install on demand with `neon skills -s <name>`)

- `neon-postgres` — SQL, schema, inspect, search on an existing DATABASE_URL.
- `neon-auth` — Managed Better Auth (login, users, sessions). Fetch manually:
  https://neon.com/docs/ai/skills/neon-auth/SKILL.md
- `neon-functions` — long-running / streaming serverless functions.
- `neon-object-storage` — S3-compatible buckets.
- `neon-ai-gateway` — one API for LLM calls.
- `neon-realtime` — live SQL queries for reactive apps.

Registry of all skills: https://neon.com/.well-known/agent-skills

## Note for Kiro

The Neon CLI does not list `kiro` among supported `--agent` targets, so CLI
`neon skills`/`neon mcp` auto-install does not target Kiro. This skill was
installed manually. The Neon MCP server is configured in
`.kiro/settings/mcp.json` using OAuth (no API key written to disk).
