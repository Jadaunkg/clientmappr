# Day 6 Operations Runbook (Phase 1.2)

## 1) Seed database to 100k+ leads

From `backend/`:

```bash
npm run seed:scale
```

Optional clean-and-reseed:

```bash
node scripts/seedLeadsAtScale.js --count=100000 --batch=1000 --clean
```

Notes:
- Uses `source=seed_benchmark` and `external_place_id=seed-*` for idempotent upsert.
- Script creates only missing rows up to target count.

## 2) Performance benchmark (API + DB + Elasticsearch)

From `backend/`:

```bash
npm run bench:leads
```

Custom run:

```bash
node scripts/benchmarkLeadsStack.js --iterations=25 --warmup=5
```

Output includes:
- `api` latency summary (avg/p95/p99)
- `db` latency summary (avg/p95/p99)
- `elasticsearch` summary (or skipped status if not configured)
- target flags for `<500ms API`, `<200ms DB`, `<50ms ES`

## 3) Backup and restore rehearsal

Dry-run rehearsal (creates dump + validates it with `pg_restore --list`):

```bash
npm run backup:rehearsal
```

Full restore rehearsal (destructive for target DB):

```bash
node scripts/backupRehearsal.js --restore
```

Optional backup directory:

```bash
node scripts/backupRehearsal.js --backup-dir=./backups
```

Prerequisites:
- `DATABASE_URL` set.
- `pg_dump` and `pg_restore` available in PATH.
