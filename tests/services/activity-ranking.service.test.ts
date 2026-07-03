import { describe, expect, it } from "vitest";
import {
  ActivityRankingService,
  ValidationError,
} from "../../src/services/activity-ranking.service.js";

describe("ActivityRankingService validation", () => {
  const service = new ActivityRankingService({
    getWeatherForCity: async () => {
      throw new Error("should not be called");
    },
  } as never);

  it("rejects empty city", async () => {
    await expect(service.getRankings({ city: "  " })).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects single character city", async () => {
    await expect(service.getRankings({ city: "A" })).rejects.toBeInstanceOf(ValidationError);
  });
});
