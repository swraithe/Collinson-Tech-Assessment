import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default("file:./dev.db"),
  PORT: z.coerce.number().default(4000),
  FORECAST_TTL_HOURS: z.coerce.number().default(6),
  OPEN_METEO_TIMEOUT_MS: z.coerce.number().default(5000),
  SCORING_VERSION: z.string().default("v1"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  OPENAI_API_KEY: z.string().optional(),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(): Config {
  return envSchema.parse(process.env);
}
