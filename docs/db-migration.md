# Database Migration Guide

This document records the steps required to migrate the project's PostgreSQL database
(e.g. moving from one Render database to another, or to a different provider).

The app uses **Prisma ORM** with a single connection-string variable: `DATABASE_URL`.
Everything flows from that one variable, so a migration means: create the new DB,
point `DATABASE_URL` at it everywhere, then apply the Prisma schema.

---

## Files that hold the database connection

All of these reference the database and must be updated on a migration:

| File | What changes |
|------|--------------|
| `render.yaml` | Production deploy config. Sets `DATABASE_URL` for the live app. |
| `docker-compose.yml` | Local dev Postgres service + `DATABASE_URL` for the `web`/`web-dev` services. |
| `.env` | Local dev root env (added `DATABASE_URL` here). |
| `.env.example` | Template committed for new clones. |
| `.env.production.example` | Production env template. |
| `apps/web/.env` | Local web-app override. |
| `apps/web/.env.local` | Next.js local override. |
| `docs/operations.md` | Operational commands (backup/restore) reference the DB name. |
| `prisma/schema.prisma` | Only needs changing if the **provider** changes (e.g. postgresql -> mysql). Stays as-is for a Postgres-to-Postgres move. |

> The Prisma schema `datasource db { url = env("DATABASE_URL") }` never changes for a
> Postgres-to-Postgres migration — only the value of `DATABASE_URL` moves.

---

## Step-by-step migration

### 1. Create the new database
- On Render: **New Database → PostgreSQL**, choose a plan, give it a name
  (e.g. `digital-estore`).
- Render provides two connection strings:
  - **Internal**: `postgresql://<user>:<pass>@<host>/<db>`
  - **External**: `postgresql://<user>:<pass>@<host>.oregon-postgres.render.com/<db>?sslmode=require`
  - Use the **external** URL in all config (it works both in and out of Render's network
    and includes `sslmode=require`, which Render Postgres requires).

### 2. Update `render.yaml` (production)
Replace the database reference with an explicit `DATABASE_URL` value:

```yaml
services:
  - type: web
    name: pod-web
    envVars:
      - key: DATABASE_URL
        value: postgresql://<user>:<pass>@<host>.oregon-postgres.render.com/<db>?sslmode=require
```

Why explicit `value:` instead of `fromDatabase`:
- `fromDatabase: name: <dbname>` depends on Render linking the service to that DB by
  name. A stale linked database (or a dashboard-set `DATABASE_URL`) will override it and
  the deploy will silently connect to the wrong DB. An explicit URL is deterministic.
- Remove the old `databases:` block from `render.yaml` if you created the DB manually
  in the dashboard (otherwise Render tries to manage/adopt it).

### 3. Update local env files
Set `DATABASE_URL` in each to the new external connection string:

- `.env` → add/replace `DATABASE_URL=postgresql://<user>:<pass>@<host>.oregon-postgres.render.com/<db>?sslmode=require`
- `.env.example` → same
- `.env.production.example` → same (replace the old `postgresql://pod:${DB_PASSWORD}@postgres:5432/pod` form)
- `apps/web/.env` → `DATABASE_URL=postgresql://<user>:<pass>@<host>.oregon-postgres.render.com/<db>?sslmode=require`
- `apps/web/.env.local` → same

### 4. Update `docker-compose.yml` (local dev)
- `POSTGRES_DB: <new_db_name>` (and the healthcheck `pg_isready -U pod -d <new_db_name>`)
- `DATABASE_URL` in the `web` and `web-dev` service environments →
  `postgresql://pod:${POSTGRES_PASSWORD}@postgres:5432/<new_db_name>`
  (this stays `@postgres:5432` because it's the docker-compose service name, not Render).

### 5. Update `docs/operations.md`
Replace any `digital_products` / old DB name references in the backup/restore commands
with the new DB name.

### 6. Apply the Prisma schema to the new database
From the project root (uses the `DATABASE_URL` loaded from `.env`):

```bash
pnpm --filter web exec prisma generate
pnpm --filter web exec prisma migrate deploy
```

- `migrate deploy` applies existing migration files. Use it when the schema already
  matches your migration history.
- If the new DB should be built from scratch without migration history, you can use
  `prisma db push` (this is what the Docker entrypoint `docker-entrypoint.sh` runs on
  container start), but `migrate deploy` is preferred for reproducible schemas.

### 7. Commit and push
```bash
git add -A
git commit -m "migrate: point database at <new_db_name>"
git push origin main
```
Render auto-deploys (`autoDeploy: true` in `render.yaml`).

---

## Critical gotchas (learned the hard way)

1. **Dashboard env vars override `render.yaml`.** If `DATABASE_URL` was ever set manually
   in the Render dashboard, it wins over the YAML. After a migration:
   - Go to **Dashboard → pod-web → Environment**, find `DATABASE_URL`.
   - Delete the manual entry (or update it to the new URL) so the YAML value takes effect.
   - Old linked databases under the service can be unlinked/left; with an explicit URL
     they no longer matter.

2. **Don't trust `fromDatabase` name resolution alone.** It silently fell back to the old
   linked `pod-db`, causing `P1001: Can't reach database server at <old-host>:5432`.
   Always verify the host in the deploy log matches your new DB's host.

3. **Use the external URL with `sslmode=require`** for Render Postgres — internal URLs
   only resolve inside Render's network and omit the required SSL param.

4. **The DB password ends up in `render.yaml`/`.env` when set explicitly.** Fine for
   unblocking a deploy; for real production move it to a dashboard env var with
   `sync: false` and rotate it.

---

## Quick verification checklist

- [ ] New database created; note its external connection string.
- [ ] `render.yaml`: `DATABASE_URL` is an explicit `value:` to the new external URL.
- [ ] `render.yaml`: old `databases:` block removed (if DB created manually).
- [ ] All 5 env files updated with the new `DATABASE_URL`.
- [ ] `docker-compose.yml`: `POSTGRES_DB` + both `DATABASE_URL`s updated.
- [ ] `docs/operations.md`: old DB name replaced.
- [ ] `prisma migrate deploy` succeeds against the new DB locally.
- [ ] Pushed to GitHub; Render dashboard `DATABASE_URL` override cleared/updated.
- [ ] Deploy log shows the **new** DB host (not the old one).
