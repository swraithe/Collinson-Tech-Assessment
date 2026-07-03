import { Activity } from "../activities.js";
import {
  bellScore,
  clamp,
  isRainCode,
  isStormCode,
  lowerIsBetter,
  type ActivityScorer,
  type DayScore,
  type ScoreFactor,
  type WeatherDay,
} from "./types.js";

/**
 * v1 surfing proxy using general weather data.
 * Production would plug in marine API (wave height, swell period, tide).
 */
export class SurfingScorer implements ActivityScorer {
  readonly activity = Activity.SURFING;

  scoreDay(day: WeatherDay): DayScore {
    const factors: ScoreFactor[] = [];
    const wind = day.windMaxKmh;

    if (wind == null) {
      return {
        score: 25,
        factors: [{ metric: "wind", value: "unknown", impact: "neutral" }],
      };
    }

    let score = bellScore(wind, 22, 18);

    factors.push({
      metric: "wind_speed",
      value: `${wind.toFixed(0)} km/h`,
      impact: wind >= 12 && wind <= 35 ? "positive" : "negative",
    });

    if (wind < 5) {
      score = lowerIsBetter(wind, 5, 5);
      factors.push({ metric: "flat_conditions", value: "calm wind", impact: "negative" });
    }

    if (wind > 45) {
      score -= 25;
      factors.push({ metric: "high_wind", value: `${wind.toFixed(0)} km/h`, impact: "negative" });
    }

    if (isStormCode(day.weatherCode)) {
      score -= 30;
      factors.push({ metric: "storm", value: `code ${day.weatherCode}`, impact: "negative" });
    } else if (isRainCode(day.weatherCode)) {
      score -= 15;
      factors.push({ metric: "rain", value: `code ${day.weatherCode}`, impact: "negative" });
    }

    if (day.precipMm != null && day.precipMm > 5) {
      score -= 10;
      factors.push({
        metric: "precipitation",
        value: `${day.precipMm.toFixed(1)} mm`,
        impact: "negative",
      });
    }

    return { score: clamp(score), factors };
  }
}
