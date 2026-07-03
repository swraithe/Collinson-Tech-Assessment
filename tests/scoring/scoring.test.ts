import { describe, expect, it } from "vitest";
import { Activity } from "../../src/domain/activities.js";
import { rankActivities } from "../../src/domain/scoring/engine.js";
import { SkiingScorer } from "../../src/domain/scoring/skiing.scorer.js";
import { SurfingScorer } from "../../src/domain/scoring/surfing.scorer.js";
import { OutdoorSightseeingScorer } from "../../src/domain/scoring/outdoor-sightseeing.scorer.js";
import { IndoorSightseeingScorer } from "../../src/domain/scoring/indoor-sightseeing.scorer.js";
import type { WeatherDay } from "../../src/domain/scoring/types.js";
import londonForecast from "../../fixtures/open-meteo/london-forecast.json";
import chamonixForecast from "../../fixtures/open-meteo/chamonix-forecast.json";
import { mapForecastToWeatherDays } from "../../src/infrastructure/open-meteo/forecast.js";

const mildDay: WeatherDay = {
  date: "2026-07-03",
  tempMin: 15,
  tempMax: 24,
  precipMm: 0.5,
  snowfallCm: 0,
  windMaxKmh: 15,
  sunshineSec: 28800,
  weatherCode: 1,
  snowDepthM: 0,
};

const snowyDay: WeatherDay = {
  date: "2026-07-03",
  tempMin: -10,
  tempMax: -2,
  precipMm: 8,
  snowfallCm: 15,
  windMaxKmh: 25,
  sunshineSec: 7200,
  weatherCode: 73,
  snowDepthM: 1.2,
};

const hotDay: WeatherDay = {
  date: "2026-07-03",
  tempMin: 28,
  tempMax: 38,
  precipMm: 0,
  snowfallCm: 0,
  windMaxKmh: 10,
  sunshineSec: 36000,
  weatherCode: 0,
  snowDepthM: 0,
};

const stormDay: WeatherDay = {
  date: "2026-07-03",
  tempMin: 18,
  tempMax: 22,
  precipMm: 25,
  snowfallCm: 0,
  windMaxKmh: 55,
  sunshineSec: 3600,
  weatherCode: 95,
  snowDepthM: 0,
};

const nullDay: WeatherDay = {
  date: "2026-07-03",
  tempMin: null,
  tempMax: null,
  precipMm: null,
  snowfallCm: null,
  windMaxKmh: null,
  sunshineSec: null,
  weatherCode: null,
  snowDepthM: null,
};

describe("SkiingScorer", () => {
  it("scores snowy cold days highly", () => {
    const result = new SkiingScorer().scoreDay(snowyDay);
    expect(result.score).toBeGreaterThan(70);
  });

  it("scores hot days poorly", () => {
    const result = new SkiingScorer().scoreDay(hotDay);
    expect(result.score).toBeLessThan(40);
  });
});

describe("SurfingScorer", () => {
  it("prefers moderate wind", () => {
    const result = new SurfingScorer().scoreDay(mildDay);
    expect(result.score).toBeGreaterThan(40);
  });

  it("penalizes storms", () => {
    const result = new SurfingScorer().scoreDay(stormDay);
    expect(result.score).toBeLessThan(30);
  });
});

describe("OutdoorSightseeingScorer", () => {
  it("scores mild sunny days highly", () => {
    const result = new OutdoorSightseeingScorer().scoreDay(mildDay);
    expect(result.score).toBeGreaterThan(60);
  });

  it("penalizes extreme heat", () => {
    const result = new OutdoorSightseeingScorer().scoreDay(hotDay);
    expect(result.score).toBeLessThan(50);
  });
});

describe("IndoorSightseeingScorer", () => {
  it("scores higher when outdoor conditions are poor", () => {
    const outdoor = new OutdoorSightseeingScorer().scoreDay(stormDay);
    const indoor = new IndoorSightseeingScorer().scoreDay(stormDay);
    expect(indoor.score).toBeGreaterThan(outdoor.score);
  });
});

describe("ScoringEngine integration", () => {
  it("ranks outdoor sightseeing highest for London-like weather", () => {
    const days = mapForecastToWeatherDays(londonForecast);
    const rankings = rankActivities(days);

    expect(rankings[0].activity).toBe(Activity.OUTDOOR_SIGHTSEEING);
    expect(rankings[rankings.length - 1].activity).toBe(Activity.SKIING);
    expect(rankings.every((r) => r.rank >= 1 && r.rank <= 4)).toBe(true);
  });

  it("ranks skiing highest for Chamonix-like weather", () => {
    const days = mapForecastToWeatherDays(chamonixForecast);
    const rankings = rankActivities(days);

    expect(rankings[0].activity).toBe(Activity.SKIING);
  });

  it("handles all-null weather day without throwing", () => {
    expect(() => rankActivities([nullDay])).not.toThrow();
  });
});
