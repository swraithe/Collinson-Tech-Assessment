import { loadConfig } from "../../config.js";
import { childLogger } from "../../observability/logger.js";

export class OpenMeteoError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = "OpenMeteoError";
  }
}

export interface FetchOptions {
  retries?: number;
}

export async function fetchJson<T>(
  url: string,
  parse: (data: unknown) => T,
  options: FetchOptions = {},
): Promise<T> {
  const config = loadConfig();
  const retries = options.retries ?? 2;
  const log = childLogger({ url });

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.OPEN_METEO_TIMEOUT_MS);

    try {
      const start = Date.now();
      const response = await fetch(url, { signal: controller.signal });
      const durationMs = Date.now() - start;

      if (!response.ok) {
        throw new OpenMeteoError(`Open-Meteo request failed: ${response.status}`, response.status);
      }

      const data = await response.json();
      log.info({ durationMs, attempt }, "provider_call");
      return parse(data);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      log.warn({ attempt, err: lastError.message }, "provider_failure");
      if (attempt < retries) {
        await sleep(200 * 2 ** attempt);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new OpenMeteoError("Open-Meteo request failed");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
