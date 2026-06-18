-- CreateTable
CREATE TABLE "UserSecurity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "loginAlerts" BOOLEAN NOT NULL DEFAULT true,
    "suspiciousSignInDetection" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSecurity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSecurity_userId_key" ON "UserSecurity"("userId");

-- AddForeignKey
ALTER TABLE "UserSecurity" ADD CONSTRAINT "UserSecurity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
