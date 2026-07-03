import { GraphQLError } from "graphql";
import {
  ActivityRankingService,
  LocationNotFoundError,
  ValidationError,
  WeatherUnavailableError,
} from "../services/activity-ranking.service.js";

const rankingService = new ActivityRankingService();

export const typeDefs = /* GraphQL */ `
  enum Activity {
    SKIING
    SURFING
    OUTDOOR_SIGHTSEEING
    INDOOR_SIGHTSEEING
  }

  enum FactorImpact {
    positive
    negative
    neutral
  }

  input ActivityRankingsInput {
    city: String!
    countryCode: String
  }

  type ResolvedLocation {
    id: ID!
    name: String!
    country: String!
    admin1: String
    latitude: Float!
    longitude: Float!
    timezone: String!
  }

  type DateRange {
    start: String!
    end: String!
  }

  type DataFreshness {
    fetchedAt: String!
    expiresAt: String!
    isStale: Boolean!
    source: String!
  }

  type ScoreFactor {
    metric: String!
    value: String!
    impact: FactorImpact!
  }

  type DailyScore {
    date: String!
    score: Float!
    factors: [ScoreFactor!]!
  }

  type ActivityRanking {
    activity: Activity!
    rank: Int!
    score: Float!
    summary: String!
    factors: [ScoreFactor!]!
    dailyScores: [DailyScore!]!
  }

  type ActivityRankingsPayload {
    location: ResolvedLocation!
    period: DateRange!
    freshness: DataFreshness!
    scoringVersion: String!
    rankings: [ActivityRanking!]!
  }

  type HealthStatus {
    status: String!
    database: String!
    scoringVersion: String!
  }

  type Query {
    activityRankings(input: ActivityRankingsInput!): ActivityRankingsPayload!
    health: HealthStatus!
  }
`;

export const resolvers = {
  Query: {
    activityRankings: async (
      _: unknown,
      args: { input: { city: string; countryCode?: string } },
    ) => {
      try {
        return await rankingService.getRankings(args.input);
      } catch (err) {
        throw toGraphQLError(err);
      }
    },
    health: async () => {
      const { prisma } = await import("../infrastructure/db/prisma.client.js");
      const { SCORING_VERSION } = await import("../domain/scoring/version.js");

      try {
        await prisma.$queryRaw`SELECT 1`;
        return { status: "ok", database: "connected", scoringVersion: SCORING_VERSION };
      } catch {
        return { status: "degraded", database: "disconnected", scoringVersion: SCORING_VERSION };
      }
    },
  },
};

function toGraphQLError(err: unknown): GraphQLError {
  if (err instanceof ValidationError) {
    return new GraphQLError(err.message, {
      extensions: { code: err.code },
    });
  }
  if (err instanceof LocationNotFoundError) {
    return new GraphQLError(err.message, {
      extensions: { code: err.code },
    });
  }
  if (err instanceof WeatherUnavailableError) {
    return new GraphQLError(err.message, {
      extensions: { code: "WEATHER_UNAVAILABLE" },
    });
  }

  return new GraphQLError("Internal server error", {
    extensions: { code: "INTERNAL_ERROR" },
  });
}
