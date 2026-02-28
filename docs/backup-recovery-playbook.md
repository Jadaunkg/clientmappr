# Backup & Recovery Playbook — ClientMapr Phase 1

## Overview

This playbook documents the procedures to back up, restore, and rehearse disaster
recovery for the ClientMapr Phase 1 stack (Supabase Postgres, Redis, Elasticsearch).

---

## 1. Scheduled Backup Strategy

### Supabase Postgres

| Layer | Mechanism | Frequency | Retention |
|-------|-----------|-----------|-----------|
| WAL-based | Supabase built-in Point-in-Time Recovery (PITR) | Continuous | 7 days (Pro plan) |
| Logical dump | `pg_dump` via `scripts/backupRehearsal.js` | Daily CI cron | 30 days |
| Cloud storage | Dump exported to S3/GCS bucket | Per dump | 90 days |

#### Manual logical dump (run directly)
```bash
# via npm script
npm run backup:rehearsal

# or directly
node scripts/backupRehearsal.js
```

The script:
1. Connects to `SUPABASE_DB_URL` (set in `.env`)
2. Runs `pg_dump --format=custom` into `backups/<timestamp>.dump`
3. Validates the dump file is non-empty
4. Uploads to the configured S3 bucket (if `AWS_BACKUP_BUCKET` is set)

### Redis

Redis is used for caching only. Cache is ephemeral and does NOT require backup.
On failure, the system degrades gracefully to direct Supabase queries.

### Elasticsearch / Typesense

Re-indexed from Supabase on demand:
```bash
node scripts/seedLeadsAtScale.js --reindex-only
```

---

## 2. Restore Procedure

### Supabase PITR Restore (managed)

1. Log in to Supabase dashboard → **Project Settings → Backups**
2. Select the restore point (timestamp within the 7-day window)
3. Click **Restore** — this creates a new project from the snapshot
4. Update `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `.env`
5. Run smoke test: `npm run bench:leads`

### Logical Dump Restore

```bash
# 1. Obtain the dump file
aws s3 cp s3://$AWS_BACKUP_BUCKET/clientmapr/<timestamp>.dump ./restore.dump

# 2. Restore into the target database
pg_restore \
  --host=$DB_HOST \
  --port=$DB_PORT \
  --username=$DB_USER \
  --dbname=$DB_NAME \
  --format=custom \
  --no-owner \
  --no-acl \
  --clean \
  ./restore.dump

# 3. Re-apply RLS policies (idempotent)
psql $DATABASE_URL -f backend/sql/rls-policies.sql

# 4. Verify row counts
psql $DATABASE_URL -c "SELECT COUNT(*) FROM leads; SELECT COUNT(*) FROM users;"
```

---

## 3. Backup Rehearsal Script

The `backupRehearsal.js` script performs a full backup-restore cycle in a staging
environment to validate the procedure end-to-end.

```bash
npm run backup:rehearsal
```

**Steps performed:**
1. Dump Supabase Postgres to timestamped `.dump` file
2. Restore dump into an isolated test schema (`backup_rehearsal_<timestamp>`)
3. Run row-count assertions (restored counts must match source ± 1%)
4. Drop the test schema
5. Log summary: duration, size, validation result

**Expected output (success):**
```
✅ Dump created: backups/2025-01-15T12-00-00.dump (42 MB)
✅ Restore completed in 8.2s
✅ Row count validation passed (leads: 100000 ± 0, users: 250 ± 0)
✅ Test schema dropped
🎉 Backup rehearsal PASSED
```

---

## 4. Benchmark / Load Test

Before any production release, run the full benchmark suite:

```bash
npm run bench:leads
```

**Targets (all must pass):**

| Metric | Target | Measured |
|--------|--------|---------|
| Search API p50 | < 500 ms | TBD |
| Search API p95 | < 1 000 ms | TBD |
| Supabase query p50 | < 200 ms | TBD |
| Redis cache hit rate | > 80 % | TBD |
| Enrichment queue throughput | > 50 leads/min | TBD |

---

## 5. Seed at Scale

To populate a staging/production environment with realistic data:

```bash
npm run seed:scale
# equivalent: node scripts/seedLeadsAtScale.js --count=100000 --batch=1000
```

Use `--count` and `--batch` to adjust scale:
```bash
node scripts/seedLeadsAtScale.js --count=50000 --batch=500
```

---

## 6. Incident Runbook

### Step 1 — Identify

```bash
# Check health endpoint
curl https://<api-host>/api/v1/health

# Tail logs
npm run logs        # if Winston → CloudWatch/Datadog is configured
```

### Step 2 — Isolate

- **Database issue**: Check Supabase dashboard → Logs → Query performance
- **Cache issue**: `redis-cli PING` / flush stale keys: `redis-cli FLUSHDB`
- **Queue stuck**: Check BullMQ dashboard or `GET /api/v1/health` for queue metrics

### Step 3 — Mitigate

- **Read traffic spike**: Verify Redis cache is warming; extend `LEADS_SEARCH_CACHE_TTL_SECONDS`
- **Enrichment rate-limit exceeded**: Reduce `GOOGLE_MAPS_RATE_LIMIT_PER_MINUTE` in `.env`
- **DB connection exhausted**: Reduce pool size in `SUPABASE_DB_POOL_SIZE`

### Step 4 — Recover

1. Follow restore procedure in §2
2. Bump cache TTL temporarily to reduce DB load
3. Run `npm run bench:leads` to verify performance is restored

### Step 5 — Post-mortem

- Document in the `docs/` folder
- Add regression test for the failure mode
- Update RLS policies / backup schedule if needed

---

## 7. Contact & Escalation

| Role | Contact | Notes |
|------|---------|-------|
| On-call backend | Internal Slack `#backend-alerts` | Pagerduty integration planned |
| Supabase support | support@supabase.io | Pro plan SLA |
| Cloud infra | AWS Support | If S3 backup fails |

---

*Last updated: Day 7 — Phase 1 Release Hardening*
