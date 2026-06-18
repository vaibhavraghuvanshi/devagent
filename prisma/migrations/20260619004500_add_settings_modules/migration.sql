-- CreateTable
CREATE TABLE "UserIntegrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "githubConnected" BOOLEAN NOT NULL DEFAULT false,
    "slackConnected" BOOLEAN NOT NULL DEFAULT false,
    "jiraConnected" BOOLEAN NOT NULL DEFAULT false,
    "linearConnected" BOOLEAN NOT NULL DEFAULT false,
    "webhookUrl" TEXT,
    "syncIntervalMinutes" INTEGER NOT NULL DEFAULT 15,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserIntegrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBilling" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "usageAlerts" BOOLEAN NOT NULL DEFAULT true,
    "spendLimitUsd" INTEGER NOT NULL DEFAULT 0,
    "invoiceEmail" TEXT,
    "taxId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBilling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT false,
    "productUpdates" BOOLEAN NOT NULL DEFAULT true,
    "securityAlerts" BOOLEAN NOT NULL DEFAULT true,
    "weeklySummary" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursStart" TEXT NOT NULL DEFAULT '22:00',
    "quietHoursEnd" TEXT NOT NULL DEFAULT '07:00',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAdvanced" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "developerMode" BOOLEAN NOT NULL DEFAULT false,
    "betaFeatures" BOOLEAN NOT NULL DEFAULT false,
    "streamResponses" BOOLEAN NOT NULL DEFAULT true,
    "verboseToolLogs" BOOLEAN NOT NULL DEFAULT false,
    "safeMode" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAdvanced_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserIntegrations_userId_key" ON "UserIntegrations"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBilling_userId_key" ON "UserBilling"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserNotifications_userId_key" ON "UserNotifications"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAdvanced_userId_key" ON "UserAdvanced"("userId");

-- AddForeignKey
ALTER TABLE "UserIntegrations" ADD CONSTRAINT "UserIntegrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBilling" ADD CONSTRAINT "UserBilling_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotifications" ADD CONSTRAINT "UserNotifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAdvanced" ADD CONSTRAINT "UserAdvanced_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
