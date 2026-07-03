import { rankActivities, type RankedActivityScore } from "../domain/scoring/engine.js";
import { SCORING_VERSION } from "../domain/scoring/version.js";
import {
  GeocodingNotFoundError,
  isProviderError,
  WeatherService,
  WeatherUnavailableError,
  type ResolvedLocation,
  type SnapshotResult,
} from "./weather.service.js";

export interface ActivityRankingsInput {
  city: string;
  countryCode?: string;
}

export interface ActivityRankingsPayload {
  location: ResolvedLocation;
  period: { start: string; end: string };
  freshness: {
    fetchedAt: string;
    expiresAt: string;
    isStale: boolean;
    source: string;
  };
  scoringVersion: string;
  rankings: RankedActivityScore[];
}

export class ActivityRankingService {
  constructor(private readonly weatherService = new WeatherService()) {}

  async getRankings(input: ActivityRankingsInput): Promise<ActivityRankingsPayload> {
    const city = input.city?.trim();
    if (!city || city.length < 2) {
      throw new ValidationError("City name must be at least 2 characters");
    }

    if (city.length > 100) {
      throw new ValidationError("City name must be at most 100 characters");
    }

    let snapshot: SnapshotResult;

    try {
      snapshot = await this.weatherService.getWeatherForCity(city, input.countryCode);
    } catch (err) {
      if (err instanceof GeocodingNotFoundError) {
        throw new LocationNotFoundError(err.message);
      }
      if (isProviderError(err)) {
        throw new WeatherUnavailableError();
      }
      throw err;
    }

    const rankings = rankActivities(snapshot.days);
    const dates = snapshot.days.map((d) => d.date).sort();

    return {
      location: snapshot.location,
      period: {
        start: dates[0] ?? "",
        end: dates[dates.length - 1] ?? "",
      },
      freshness: {
        fetchedAt: snapshot.fetchedAt.toISOString(),
        expiresAt: snapshot.expiresAt.toISOString(),
        isStale: snapshot.isStale,
        source: snapshot.source,
      },
      scoringVersion: SCORING_VERSION,
      rankings,
    };
  }
}

export class ValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class LocationNotFoundError extends Error {
  readonly code = "LOCATION_NOT_FOUND";
  constructor(message: string) {
    super(message);
    this.name = "LocationNotFoundError";
  }
}

export { WeatherUnavailableError };
