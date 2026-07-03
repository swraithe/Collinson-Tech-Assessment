import { Activity } from "../activities.js";
import {
  avgTemp,
  bellScore,
  clamp,
  higherIsBetter,
  lowerIsBetter,
  type ActivityScorer,
  type DayScore,
  type ScoreFactor,
  type WeatherDay,
} from "./types.js";

export class SkiingScorer implements ActivityScorer {
  readonly activity = Activity.SKIING;

  scoreDay(day: WeatherDay): DayScore {
    const factors: ScoreFactor[] = [];
    const temp = avgTemp(day);

    if (temp == null) {
      return { score: 30, factors: [{ metric: "temperature", value: "unknown", impact: "neutral" }] };
    }

    let score = bellScore(temp, -3, 12);

    factors.push({
      metric: "avg_temperature",
      value: `${temp.toFixed(1)}°C`,
      impact: temp <= 2 ? "positive" : temp > 5 ? "negative" : "neutral",
    });

    if (day.snowfallCm != null && day.snowfallCm > 0) {
      const bonus = Math.min(day.snowfallCm * 8, 25);
      score += bonus;
      factors.push({
        metric: "snowfall",
        value: `${day.snowfallCm.toFixed(1)} cm`,
        impact: "positive",
      });
    }

    if (day.snowDepthM != null && day.snowDepthM > 0) {
      const bonus = Math.min(day.snowDepthM * 30, 20);
      score += bonus;
      factors.push({
        metric: "snow_depth",
        value: `${day.snowDepthM.toFixed(2)} m`,
        impact: "positive",
      });
    }

    if (temp > 5) {
      score = lowerIsBetter(temp, 5, 15);
      factors.push({
        metric: "warmth_penalty",
        value: `${temp.toFixed(1)}°C`,
        impact: "negative",
      });
    }

    if (day.precipMm != null && day.precipMm > 5 && (day.snowfallCm ?? 0) === 0) {
      score -= 10;
      factors.push({
        metric: "rain_not_snow",
        value: `${day.precipMm.toFixed(1)} mm`,
        impact: "negative",
      });
    }

    return { score: clamp(score), factors };
  }
}
