import { loadConfig } from "../config.js";
import { SCORING_VERSION } from "../domain/scoring/version.js";
import { prisma } from "../infrastructure/db/prisma.client.js";
import {
  buildQueryKey,
  geocodeCity,
  GeocodingNotFoundError,
} from "../infrastructure/open-meteo/geocoding.js";
import {
  fetchForecast,
  mapDbRowsToWeatherDays,
  mapForecastToWeatherDays,
  mapWeatherDaysToDbRows,
} from "../infrastructure/open-meteo/forecast.js";
import { OpenMeteoError } from "../infrastructure/open-meteo/client.js";
import { refreshLock } from "../infrastructure/db/refresh-lock.js";
import { childLogger } from "../observability/logger.js";
import type { WeatherDay } from "../domain/scoring/types.js";

export { GeocodingNotFoundError };

export interface ResolvedLocation {
  id: string;
  name: string;
  country: string;
  admin1: string | null;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface SnapshotResult {
  location: ResolvedLocation;
  days: WeatherDay[];
  fetchedAt: Date;
  expiresAt: Date;
  isStale: boolean;
  source: "cache" | "refreshed" | "stale-fallback";
}

export class WeatherService {
  private readonly log = childLogger({ service: "WeatherService" });

  async getWeatherForCity(city: string, countryCode?: string): Promise<SnapshotResult> {
    const queryKey = buildQueryKey(city, countryCode);
    let location = await prisma.location.findUnique({ where: { queryKey } });

    if (!location) {
      const geo = await geocodeCity(city, { countryCode });
      location = await prisma.location.upsert({
        where: { queryKey },
        create: {
          queryKey,
          name: geo.name,
          country: geo.country,
          admin1: geo.admin1 ?? null,
          latitude: geo.latitude,
          longitude: geo.longitude,
          timezone: geo.timezone,
        },
        update: {
          name: geo.name,
          country: geo.country,
          admin1: geo.admin1 ?? null,
          latitude: geo.latitude,
          longitude: geo.longitude,
          timezone: geo.timezone,
          geocodedAt: new Date(),
        },
      });
    }

    const resolved: ResolvedLocation = {
      id: location.id,
      name: location.name,
      country: location.country,
      admin1: location.admin1,
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: location.timezone,
    };

    const latest = await this.getLatestSnapshot(location.id);
    const now = new Date();

    if (latest && latest.expiresAt > now) {
      this.log.info({ locationId: location.id }, "cache_hit");
      return {
        location: resolved,
        days: latest.days,
        fetchedAt: latest.fetchedAt,
        expiresAt: latest.expiresAt,
        isStale: false,
        source: "cache",
      };
    }

    return refreshLock.withLock(location.id, async () => {
      const recheck = await this.getLatestSnapshot(location!.id);
      if (recheck && recheck.expiresAt > new Date()) {
        this.log.info({ locationId: location!.id }, "cache_hit");
        return {
          location: resolved,
          days: recheck.days,
          fetchedAt: recheck.fetchedAt,
          expiresAt: recheck.expiresAt,
          isStale: false,
          source: "cache",
        };
      }

      try {
        const snapshot = await this.refreshForecast(resolved);
        this.log.info({ locationId: location!.id }, "cache_miss");
        return snapshot;
      } catch (err) {
        if (latest) {
          this.log.warn({ locationId: location!.id, err }, "cache_stale_fallback");
          return {
            location: resolved,
            days: latest.days,
            fetchedAt: latest.fetchedAt,
            expiresAt: latest.expiresAt,
            isStale: true,
            source: "stale-fallback",
          };
        }
        throw err;
      }
    });
  }

  private async getLatestSnapshot(locationId: string) {
    const snapshot = await prisma.forecastSnapshot.findFirst({
      where: { locationId },
      orderBy: { fetchedAt: "desc" },
      include: { daily: { orderBy: { forecastDate: "asc" } } },
    });

    if (!snapshot) return null;

    return {
      fetchedAt: snapshot.fetchedAt,
      expiresAt: snapshot.expiresAt,
      days: mapDbRowsToWeatherDays(snapshot.daily),
    };
  }

  private async refreshForecast(location: ResolvedLocation): Promise<SnapshotResult> {
    const config = loadConfig();
    const forecast = await fetchForecast(location.latitude, location.longitude, location.timezone);
    const days = mapForecastToWeatherDays(forecast);
    const fetchedAt = new Date();
    const expiresAt = new Date(fetchedAt.getTime() + config.FORECAST_TTL_HOURS * 60 * 60 * 1000);

    const snapshot = await prisma.forecastSnapshot.create({
      data: {
        locationId: location.id,
        fetchedAt,
        expiresAt,
        rawForecast: JSON.stringify(forecast),
        daily: {
          create: mapWeatherDaysToDbRows(days),
        },
      },
    });

    await this.persistScores(location.id, snapshot.id, days);

    return {
      location,
      days,
      fetchedAt,
      expiresAt,
      isStale: false,
      source: "refreshed",
    };
  }

  private async persistScores(locationId: string, snapshotId: string, days: WeatherDay[]) {
    const { rankActivities } = await import("../domain/scoring/engine.js");
    const rankings = rankActivities(days);

    for (const ranking of rankings) {
      for (const daily of ranking.dailyScores) {
        await prisma.activityScore.upsert({
          where: {
            snapshotId_forecastDate_activity_scoringVersion: {
              snapshotId,
              forecastDate: new Date(daily.date),
              activity: ranking.activity,
              scoringVersion: SCORING_VERSION,
            },
          },
          create: {
            snapshotId,
            locationId,
            forecastDate: new Date(daily.date),
            activity: ranking.activity,
            scoringVersion: SCORING_VERSION,
            score: daily.score,
            factors: JSON.stringify(daily.factors),
          },
          update: {
            score: daily.score,
            factors: JSON.stringify(daily.factors),
          },
        });
      }
    }
  }
}

export class WeatherUnavailableError extends Error {
  constructor(message = "Weather data unavailable") {
    super(message);
    this.name = "WeatherUnavailableError";
  }
}

export function isProviderError(err: unknown): boolean {
  return err instanceof OpenMeteoError || err instanceof WeatherUnavailableError;
}
