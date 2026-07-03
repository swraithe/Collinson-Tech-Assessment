import type { WeatherDay } from "../../domain/scoring/types.js";
import { fetchJson } from "./client.js";
import { forecastResponseSchema, type ForecastResponse } from "./types.js";

const FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";

const DAILY_VARS = [
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "snowfall_sum",
  "wind_speed_10m_max",
  "sunshine_duration",
  "weathercode",
].join(",");

export async function fetchForecast(
  latitude: number,
  longitude: number,
  timezone: string,
): Promise<ForecastResponse> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone,
    forecast_days: "7",
    daily: DAILY_VARS,
  });

  const url = `${FORECAST_BASE}?${params.toString()}`;
  return fetchJson(url, (raw) => forecastResponseSchema.parse(raw));
}

export function mapForecastToWeatherDays(forecast: ForecastResponse): WeatherDay[] {
  const { daily } = forecast;
  return daily.time.map((date, i) => ({
    date,
    tempMin: daily.temperature_2m_min?.[i] ?? null,
    tempMax: daily.temperature_2m_max?.[i] ?? null,
    precipMm: daily.precipitation_sum?.[i] ?? null,
    snowfallCm: daily.snowfall_sum?.[i] ?? null,
    windMaxKmh: daily.wind_speed_10m_max?.[i] ?? null,
    sunshineSec: daily.sunshine_duration?.[i] ?? null,
    weatherCode: daily.weathercode?.[i] ?? null,
    snowDepthM: null,
  }));
}

export function mapWeatherDaysToDbRows(days: WeatherDay[]) {
  return days.map((day) => ({
    forecastDate: new Date(day.date),
    tempMin: day.tempMin,
    tempMax: day.tempMax,
    precipMm: day.precipMm,
    snowfallCm: day.snowfallCm,
    windMaxKmh: day.windMaxKmh,
    sunshineSec: day.sunshineSec,
    weatherCode: day.weatherCode,
    snowDepthM: day.snowDepthM,
  }));
}

export function mapDbRowsToWeatherDays(
  rows: Array<{
    forecastDate: Date;
    tempMin: number | null;
    tempMax: number | null;
    precipMm: number | null;
    snowfallCm: number | null;
    windMaxKmh: number | null;
    sunshineSec: number | null;
    weatherCode: number | null;
    snowDepthM: number | null;
  }>,
): WeatherDay[] {
  return rows.map((row) => ({
    date: row.forecastDate.toISOString().slice(0, 10),
    tempMin: row.tempMin,
    tempMax: row.tempMax,
    precipMm: row.precipMm,
    snowfallCm: row.snowfallCm,
    windMaxKmh: row.windMaxKmh,
    sunshineSec: row.sunshineSec,
    weatherCode: row.weatherCode,
    snowDepthM: row.snowDepthM,
  }));
}
