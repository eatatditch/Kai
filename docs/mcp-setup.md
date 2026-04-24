# MCP server setup

`.mcp.json` at the repo root declares the Model Context Protocol servers Claude Code should load whenever a session opens this project. They give Claude direct, typed access to Supabase, Vercel, and the project database — so setup tasks like "apply this migration" or "configure auth URLs" become a single tool call instead of a curl-via-GitHub-Actions dance.

## Servers declared

| Server | Purpose | Required env vars |
| --- | --- | --- |
| `supabase` | Manage projects, run SQL, manage Auth config, generate types | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` |
| `vercel` | List deployments, fetch logs, manage env vars | `VERCEL_TOKEN`, `VERCEL_PROJECT_ID` |
| `postgres` | Direct DB queries with no service-role-key handling | `SUPABASE_DB_URL` (Postgres connection string) |

The env vars are resolved from the Claude Code session's environment (your shell or Claude Code's env-var settings) — they are not stored in the repo.

## How to wire them up (one time, per machine/session)

In Claude Code, set the env vars used above. The exact UI depends on Claude Code surface:

- **Claude Code on the web:** Settings → Environment Variables. Add each name/value, save, restart the session.
- **Claude Code CLI (local):** export them in your shell profile, or use a per-project `.env` loaded by your shell.
- **Codespaces / sandbox:** add them as Codespace secrets so each new container has them.

### Where to get each value

- `SUPABASE_ACCESS_TOKEN` — https://supabase.com/dashboard/account/tokens (Personal Access Token)
- `SUPABASE_PROJECT_REF` — the subdomain of your project URL (`https://<ref>.supabase.co`)
- `SUPABASE_DB_URL` — Project Settings → Database → Connection string (URI). Use the **Session pooler** URL with the password inline, or use the direct connection.
- `VERCEL_TOKEN` — https://vercel.com/account/tokens
- `VERCEL_PROJECT_ID` — Vercel project → Settings → General → Project ID

## What this unlocks

Once these are loaded, future sessions in this repo can:

- Apply migrations and run ad-hoc SQL through the Supabase MCP server (no GitHub Actions detour).
- Configure Auth URL allow lists, providers, email templates without leaving Claude.
- Query Postgres directly for debugging.
- Pull Vercel deploy logs when CI/preview blows up.

Without them — like the very first session that scaffolded this repo — Claude has to use `gh`-driven workflows or ask the human to click through dashboards. Don't accept that on the second session.
