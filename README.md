# CivicLens

CivicLens monitors public social-media mentions of tracked leaders. It uses FastAPI, Supabase Auth/Postgres, and the X recent-search API.

## What is operational

- Authenticated leader management and mention viewing.
- User-isolated Supabase data with row-level security.
- Manual and scheduled X collection for monitored leaders.
- Private reports, profile settings, and platform statistics.

Facebook, Instagram, and YouTube are shown as unavailable until their approved provider integrations are complete.

## One-time Supabase setup

Apply [0001_civiclens_core.sql](supabase/migrations/0001_civiclens_core.sql) in the Supabase SQL Editor or via the Supabase CLI before deployment. It creates the CivicLens tables, profile trigger, indexes, run history, and row-level-security policies.

## Required environment variables

```text
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
X_BEARER_TOKEN=
CRON_SECRET=
```

`SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` are server-only secrets. Never include them in browser code or commit them to Git.

## Scheduled collection

[vercel.json](vercel.json) schedules `/api/cron/collect` once an hour. Vercel invokes it with `Authorization: Bearer <CRON_SECRET>`. The endpoint uses the Supabase service-role key only on the server to find users with monitored leaders, runs collection, and records each user’s outcome in `collection_runs`.

Set all required variables in the Vercel project settings before deployment. The scheduler intentionally processes only providers registered as operational; currently that is X.

## Verification

```text
python -m compileall -q api backend
python -m unittest discover -s tests -p "test_*.py" -v
```

GitHub Actions runs these checks plus JavaScript syntax validation for every push and pull request.
