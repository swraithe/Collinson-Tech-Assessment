import type { Activity } from "../activities.js";

export interface WeatherDay {
  date: string;
  tempMin: number | null;
  tempMax: number | null;
  precipMm: number | null;
  snowfallCm: number | null;
  windMaxKmh: number | null;
  sunshineSec: number | null;
  weatherCode: number | null;
  snowDepthM: number | null;
}

export type FactorImpact = "positive" | "negative" | "neutral";

export interface ScoreFactor {
  metric: string;
  value: string;
  impact: FactorImpact;
}

export interface DayScore {
  score: number;
  factors: ScoreFactor[];
}

export interface ActivityScorer {
  readonly activity: Activity;
  scoreDay(day: WeatherDay): DayScore;
}

export interface ActivityScoreResult {
  activity: Activity;
  score: number;
  summary: string;
  factors: ScoreFactor[];
  dailyScores: Array<{ date: string; score: number; factors: ScoreFactor[] }>;
}

export function avgTemp(day: WeatherDay): number | null {
  if (day.tempMin == null && day.tempMax == null) return null;
  if (day.tempMin == null) return day.tempMax;
  if (day.tempMax == null) return day.tempMin;
  return (day.tempMin + day.tempMax) / 2;
}

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function bellScore(value: number, ideal: number, tolerance: number): number {
  const distance = Math.abs(value - ideal);
  return clamp(100 - (distance / tolerance) * 100);
}

export function lowerIsBetter(value: number, threshold: number, maxPenalty: number): number {
  if (value <= threshold) return 100;
  return clamp(100 - ((value - threshold) / maxPenalty) * 100);
}

export function higherIsBetter(value: number, threshold: number, maxBonus: number): number {
  if (value >= threshold) return 100;
  return clamp((value / threshold) * 100);
}

export function isRainCode(code: number | null): boolean {
  if (code == null) return false;
  return (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code === 95 || code === 96 || code === 99;
}

export function isStormCode(code: number | null): boolean {
  if (code == null) return false;
  return code >= 95;
}
