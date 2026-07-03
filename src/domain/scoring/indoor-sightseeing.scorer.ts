import { Activity } from "../activities.js";
import { OutdoorSightseeingScorer } from "./outdoor-sightseeing.scorer.js";
import { clamp, type ActivityScorer, type DayScore, type WeatherDay } from "./types.js";

export class IndoorSightseeingScorer implements ActivityScorer {
  readonly activity = Activity.INDOOR_SIGHTSEEING;
  private readonly outdoorScorer = new OutdoorSightseeingScorer();

  scoreDay(day: WeatherDay): DayScore {
    const outdoor = this.outdoorScorer.scoreDay(day);
    const score = clamp(100 - outdoor.score + 20);
    const factors = outdoor.factors.map((f) => ({
      ...f,
      impact: f.impact === "positive" ? ("negative" as const) : f.impact === "negative" ? ("positive" as const) : ("neutral" as const),
    }));

    return { score, factors };
  }
}
