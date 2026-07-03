# Activity Weather Ranker

GraphQL backend that accepts a city or town and ranks how good the next 7 days will be for skiing, surfing, outdoor sightseeing, and indoor sightseeing.

## What I built

A Node.js / TypeScript / GraphQL service backed by Open-Meteo forecast data. Weather is persisted in SQLite (via Prisma) with a 6-hour TTL so repeat requests hit the cache. Activity scores are computed by deterministic, versioned scoring rules (`scoringVersion: v1`) — not an LLM — so results are repeatable and testable.

## How to run

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate   # or: npx prisma db push
npm run dev
```

Open http://localhost:4000/graphql and run:

```graphql
query {
  activityRankings(input: { city: "London" }) {
    scoringVersion
    freshness { fetchedAt expiresAt isStale source }
    location { name country latitude longitude timezone }
    period { start end }
    rankings {
      rank
      activity
      score
      summary
      factors { metric value impact }
    }
  }
}
```

Run tests:

```bash
npm test
```

## Assumptions

- **Scoring:** 0–100 relative scores, 7-day arithmetic mean, `scoringVersion: v1`
- **Geocoding:** best Open-Meteo match (highest population); optional `countryCode` for disambiguation
- **Freshness:** 6-hour TTL; stale data returned with `isStale: true` if provider fails but cache exists
- **Surfing (v1):** weather proxy (wind/rain) — marine API deferred to v2 plug-in
- **Skiing (v1):** city-level temp/snowfall/snow depth — not resort elevation or piste conditions
- **Indoor sightseeing:** higher when outdoor conditions are poor (+ baseline availability)
- **Timezone:** forecast window uses destination timezone (`timezone=auto`)
- **Storage:** SQLite for take-home; schema is Postgres-compatible for production migration
- **Idempotency:** upserts on location and scores; refresh lock prevents cache stampede
- **No frontend, no auth** — backend exercise scope only

See [`NOTES.md`](NOTES.md) for raw decision log and cuts.
