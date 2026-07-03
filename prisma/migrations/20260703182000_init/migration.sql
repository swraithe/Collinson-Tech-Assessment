-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "queryKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "admin1" TEXT,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "timezone" TEXT NOT NULL,
    "geocodedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ForecastSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locationId" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "rawForecast" TEXT NOT NULL,
    "providerVersion" TEXT NOT NULL DEFAULT 'open-meteo-v1',
    CONSTRAINT "ForecastSnapshot_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeatherDaily" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "snapshotId" TEXT NOT NULL,
    "forecastDate" DATETIME NOT NULL,
    "tempMin" REAL,
    "tempMax" REAL,
    "precipMm" REAL,
    "snowfallCm" REAL,
    "windMaxKmh" REAL,
    "sunshineSec" REAL,
    "weatherCode" INTEGER,
    "snowDepthM" REAL,
    CONSTRAINT "WeatherDaily_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ForecastSnapshot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "snapshotId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "forecastDate" DATETIME NOT NULL,
    "activity" TEXT NOT NULL,
    "scoringVersion" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "factors" TEXT NOT NULL,
    CONSTRAINT "ActivityScore_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ForecastSnapshot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityScore_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RefreshLock" (
    "locationId" TEXT NOT NULL PRIMARY KEY,
    "lockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_queryKey_key" ON "Location"("queryKey");

-- CreateIndex
CREATE INDEX "Location_queryKey_idx" ON "Location"("queryKey");

-- CreateIndex
CREATE INDEX "ForecastSnapshot_locationId_expiresAt_idx" ON "ForecastSnapshot"("locationId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastSnapshot_locationId_fetchedAt_key" ON "ForecastSnapshot"("locationId", "fetchedAt");

-- CreateIndex
CREATE INDEX "WeatherDaily_forecastDate_idx" ON "WeatherDaily"("forecastDate");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherDaily_snapshotId_forecastDate_key" ON "WeatherDaily"("snapshotId", "forecastDate");

-- CreateIndex
CREATE INDEX "ActivityScore_locationId_scoringVersion_idx" ON "ActivityScore"("locationId", "scoringVersion");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityScore_snapshotId_forecastDate_activity_scoringVersion_key" ON "ActivityScore"("snapshotId", "forecastDate", "activity", "scoringVersion");
