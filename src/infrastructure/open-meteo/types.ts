import { z } from "zod";

export const geocodingResponseSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        country: z.string(),
        admin1: z.string().optional(),
        latitude: z.number(),
        longitude: z.number(),
        timezone: z.string(),
        population: z.number().optional(),
      }),
    )
    .optional(),
});

export type GeocodingResult = z.infer<typeof geocodingResponseSchema>["results"] extends
  | (infer T)[]
  | undefined
  ? T
  : never;

export const forecastResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  daily: z.object({
    time: z.array(z.string()),
    temperature_2m_max: z.array(z.number()).optional(),
    temperature_2m_min: z.array(z.number()).optional(),
    precipitation_sum: z.array(z.number()).optional(),
    snowfall_sum: z.array(z.number()).optional(),
    wind_speed_10m_max: z.array(z.number()).optional(),
    sunshine_duration: z.array(z.number()).optional(),
    weathercode: z.array(z.number()).optional(),
    snow_depth: z.array(z.number()).optional(),
  }),
});

export type ForecastResponse = z.infer<typeof forecastResponseSchema>;
