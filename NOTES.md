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
