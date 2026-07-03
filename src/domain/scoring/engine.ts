import { ACTIVITY_LABELS, Activity } from "../activities.js";
import { IndoorSightseeingScorer } from "./indoor-sightseeing.scorer.js";
import { OutdoorSightseeingScorer } from "./outdoor-sightseeing.scorer.js";
import { SkiingScorer } from "./skiing.scorer.js";
import { SurfingScorer } from "./surfing.scorer.js";
import {
  type ActivityScoreResult,
  type ActivityScorer,
  type WeatherDay,
} from "./types.js";
import { SCORING_VERSION } from "./version.js";

export { SCORING_VERSION };

const defaultScorers: ActivityScorer[] = [
  new SkiingScorer(),
  new SurfingScorer(),
  new OutdoorSightseeingScorer(),
  new IndoorSightseeingScorer(),
];

export class ScoringEngine {
  constructor(private readonly scorers: ActivityScorer[] = defaultScorers) {}

  score(days: WeatherDay[]): ActivityScoreResult[] {
    const results = this.scorers.map((scorer) => {
      const dailyScores = days.map((day) => {
        const { score, factors } = scorer.scoreDay(day);
        return { date: day.date, score, factors };
      });

      const score =
        dailyScores.length === 0
          ? 0
          : dailyScores.reduce((sum, d) => sum + d.score, 0) / dailyScores.length;

      const topFactors = aggregateFactors(dailyScores.flatMap((d) => d.factors));

      return {
        activity: scorer.activity,
        score: Math.round(score * 10) / 10,
        summary: buildSummary(scorer.activity, score, topFactors),
        factors: topFactors.slice(0, 5),
        dailyScores,
      };
    });

    return results
      .sort((a, b) => b.score - a.score || a.activity.localeCompare(b.activity))
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }
}

function aggregateFactors(
  factors: Array<{ metric: string; value: string; impact: string }>,
) {
  const counts = new Map<string, { metric: string; value: string; impact: string; count: number }>();

  for (const f of factors) {
    const key = `${f.metric}:${f.impact}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { ...f, count: 1 });
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .map(({ metric, value, impact }) => ({ metric, value, impact: impact as "positive" | "negative" | "neutral" }));
}

function buildSummary(
  activity: Activity,
  score: number,
  factors: Array<{ metric: string; impact: string }>,
): string {
  const label = ACTIVITY_LABELS[activity];
  const positives = factors.filter((f) => f.impact === "positive").length;
  const negatives = factors.filter((f) => f.impact === "negative").length;

  if (score >= 70) {
    return `${label} looks strong this week (${score.toFixed(0)}/100) with ${positives} favourable signal(s).`;
  }
  if (score >= 45) {
    return `${label} is moderate this week (${score.toFixed(0)}/100) — mixed conditions.`;
  }
  return `${label} is weak this week (${score.toFixed(0)}/100) with ${negatives} limiting factor(s).`;
}

export type RankedActivityScore = ActivityScoreResult & { rank: number };

export function rankActivities(days: WeatherDay[]): RankedActivityScore[] {
  const engine = new ScoringEngine();
  return engine.score(days) as RankedActivityScore[];
}
