export enum Activity {
  SKIING = "SKIING",
  SURFING = "SURFING",
  OUTDOOR_SIGHTSEEING = "OUTDOOR_SIGHTSEEING",
  INDOOR_SIGHTSEEING = "INDOOR_SIGHTSEEING",
}

export const ALL_ACTIVITIES: Activity[] = [
  Activity.SKIING,
  Activity.SURFING,
  Activity.OUTDOOR_SIGHTSEEING,
  Activity.INDOOR_SIGHTSEEING,
];

export const ACTIVITY_LABELS: Record<Activity, string> = {
  [Activity.SKIING]: "Skiing",
  [Activity.SURFING]: "Surfing",
  [Activity.OUTDOOR_SIGHTSEEING]: "Outdoor sightseeing",
  [Activity.INDOOR_SIGHTSEEING]: "Indoor sightseeing",
};
