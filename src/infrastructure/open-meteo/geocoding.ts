import { fetchJson } from "./client.js";
import { geocodingResponseSchema, type GeocodingResult } from "./types.js";

const GEOCODING_BASE = "https://geocoding-api.open-meteo.com/v1/search";

export interface GeocodingOptions {
  countryCode?: string;
  count?: number;
}

export async function geocodeCity(
  name: string,
  options: GeocodingOptions = {},
): Promise<GeocodingResult> {
  const params = new URLSearchParams({
    name,
    count: String(options.count ?? 5),
    language: "en",
    format: "json",
  });

  if (options.countryCode) {
    params.set("countryCode", options.countryCode);
  }

  const url = `${GEOCODING_BASE}?${params.toString()}`;
  const data = await fetchJson(url, (raw) => geocodingResponseSchema.parse(raw));
  const results = data.results ?? [];

  if (results.length === 0) {
    throw new GeocodingNotFoundError(name);
  }

  return results.sort((a, b) => (b.population ?? 0) - (a.population ?? 0))[0];
}

export class GeocodingNotFoundError extends Error {
  constructor(city: string) {
    super(`No location found for "${city}"`);
    this.name = "GeocodingNotFoundError";
  }
}

export function buildQueryKey(city: string, countryCode?: string): string {
  const normalized = city.trim().toLowerCase();
  return countryCode ? `${normalized}:${countryCode.toUpperCase()}` : normalized;
}
