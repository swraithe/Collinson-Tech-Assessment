import { Activity } from "../activities.js";
import {
  avgTemp,
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

export class OutdoorSightseeingScorer implements ActivityScorer {
  readonly activity = Activity.OUTDOOR_SIGHTSEEING;

  scoreDay(day: WeatherDay): DayScore {
    const factors: ScoreFactor[] = [];
    const temp = avgTemp(day);
    let score = 70;

    if (temp != null) {
      const tempScore = bellScore(temp, 20, 14);
      score = tempScore;
      factors.push({
        metric: "avg_temperature",
        value: `${temp.toFixed(1)}°C`,
        impact: temp >= 15 && temp <= 26 ? "positive" : "negative",
      });

      if (temp > 30) {
        score = lowerIsBetter(temp, 30, 10);
        factors.push({
          metric: "extreme_heat",
          value: `${temp.toFixed(1)}°C`,
          impact: "negative",
        });
      } else if (temp < 5) {
        score = lowerIsBetter(Math.abs(temp - 5), 0, 10);
        factors.push({
          metric: "extreme_cold",
          value: `${temp.toFixed(1)}°C`,
          impact: "negative",
        });
      }
    }

    if (day.precipMm != null) {
      const precipScore = lowerIsBetter(day.precipMm, 2, 15);
      score = (score + precipScore) / 2;
      factors.push({
        metric: "precipitation",
        value: `${day.precipMm.toFixed(1)} mm`,
        impact: day.precipMm <= 2 ? "positive" : "negative",
      });
    }

    if (day.sunshineSec != null) {
      const hours = day.sunshineSec / 3600;
      const sunScore = lowerIsBetter(Math.max(0, 4 - hours), 0, 4) === 100
        ? 100
        : clamp((hours / 4) * 100);
      score = (score + sunScore) / 2;
      factors.push({
        metric: "sunshine",
        value: `${hours.toFixed(1)} h`,
        impact: hours >= 4 ? "positive" : "negative",
      });
    }

    if (day.windMaxKmh != null) {
      const windScore = lowerIsBetter(day.windMaxKmh, 30, 25);
      score = (score + windScore) / 2;
      factors.push({
        metric: "wind",
        value: `${day.windMaxKmh.toFixed(0)} km/h`,
        impact: day.windMaxKmh <= 30 ? "positive" : "negative",
      });
    }

    if (isStormCode(day.weatherCode)) {
      score -= 35;
      factors.push({ metric: "storm", value: `code ${day.weatherCode}`, impact: "negative" });
    } else if (isRainCode(day.weatherCode)) {
      score -= 20;
      factors.push({ metric: "rain", value: `code ${day.weatherCode}`, impact: "negative" });
    }

    if (temp != null && temp > 30) {
      score = Math.min(score, 40);
    }

    return { score: clamp(score), factors };
  }
}
