# Notes (unpolished decision log)

## 2026-07-03 — Stack

- Chose **Prisma + SQLite** for zero-infra local setup; schema avoids SQLite-only types so Postgres migration is straightforward.
- Chose **GraphQL Yoga** over Apollo — lighter for a single-query API.
- Scoring before HTTP/DB wiring — rankings are the product decision; everything else is plumbing.

## 2026-07-03 — Cuts (planned)

- **Marine API for surfing (v1):** using wind/rain weather proxy instead. Marine plug-in deferred to v2 via `ActivityScorer` interface.
- **Scheduled background refresh:** TTL-on-read is enough for take-home scope.
- **LLM explanations:** optional/env-gated; deterministic template summaries are the default.
- **snow_depth daily variable:** Open-Meteo returns 400 for daily snow_depth — removed from fetch; skiing scorer uses snowfall only in v1.

## 2026-07-03 — Prisma on Windows

- `prisma generate` hit EBUSY on query engine DLL. Used `engineType = "library"` in schema; manual engine copy as fallback. Works for local dev.

## 2026-07-03 — Production gaps (documented, not built)

- **Multi-instance lock:** SQLite RefreshLock is single-node; Postgres → pg_advisory_xact_lock or Redis.
- **Stampede edge case:** after lock wait timeout, refresh may still run unlocked — acceptable for take-home.
- **Rate limiting:** not implemented; would sit at API gateway or in-memory middleware.
- **Request correlation IDs:** not wired; would add middleware → Pino child logger.
- **Data retention:** no cleanup job; prod would delete snapshots older than 7 days.
- **Metrics:** structured logs only; prod adds Prometheus counters (cache_hit, provider_error).
- **CI:** no GitHub Actions; prod runs prisma migrate deploy + tests before deploy.
- **Circuit breaker:** not added for Open-Meteo; stale fallback is enough for v1.
- **snow_depth:** cut from API (400); skiing v1 uses snowfall only, not snow depth.
- **Chamonix / skiing:** city summer forecast ≠ resort snow conditions — scoring proxy limitation.
- **Commit count:** 3 commits total — ran out of time to split infra vs GraphQL further.
