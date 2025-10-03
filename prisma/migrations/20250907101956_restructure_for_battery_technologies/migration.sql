/*
  Warnings:

  - You are about to drop the column `saasCustomerId` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `saasCustomerId` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the `saas_customers` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `serviceProviderId` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceProviderId` to the `jobs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ServiceType" AS ENUM ('MAINTENANCE', 'REPAIR', 'REPLACEMENT', 'INSTALLATION', 'INSPECTION', 'TESTING');

-- CreateTable
CREATE TABLE "public"."service_providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT,
    "status" "public"."CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_providers_pkey" PRIMARY KEY ("id")
);

-- Migrate existing SaaS customers to service providers
INSERT INTO "public"."service_providers" ("id", "name", "email", "phone", "address", "city", "state", "zipCode", "country", "status", "createdAt", "updatedAt")
SELECT "id", "name", "email", "phone", "address", "city", "state", "zipCode", "country", "status", "createdAt", "updatedAt"
FROM "public"."saas_customers";

-- Add new columns to customers table
ALTER TABLE "public"."customers" ADD COLUMN "serviceProviderId" TEXT;

-- Migrate existing customer data
UPDATE "public"."customers" SET "serviceProviderId" = "saasCustomerId";

-- Make serviceProviderId NOT NULL
ALTER TABLE "public"."customers" ALTER COLUMN "serviceProviderId" SET NOT NULL;

-- Add new columns to jobs table
ALTER TABLE "public"."jobs" ADD COLUMN "serviceProviderId" TEXT;
ALTER TABLE "public"."jobs" ADD COLUMN "batteryModel" TEXT;
ALTER TABLE "public"."jobs" ADD COLUMN "batterySerial" TEXT;
ALTER TABLE "public"."jobs" ADD COLUMN "batteryType" TEXT;
ALTER TABLE "public"."jobs" ADD COLUMN "serviceType" "public"."ServiceType" NOT NULL DEFAULT 'MAINTENANCE';

-- Migrate existing job data
UPDATE "public"."jobs" SET "serviceProviderId" = "saasCustomerId";

-- Make serviceProviderId NOT NULL
ALTER TABLE "public"."jobs" ALTER COLUMN "serviceProviderId" SET NOT NULL;

-- DropForeignKey
ALTER TABLE "public"."customers" DROP CONSTRAINT "customers_saasCustomerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."jobs" DROP CONSTRAINT "jobs_saasCustomerId_fkey";

-- Drop old columns
ALTER TABLE "public"."customers" DROP COLUMN "saasCustomerId";
ALTER TABLE "public"."jobs" DROP COLUMN "saasCustomerId";

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "role" SET DEFAULT 'TECHNICIAN';

-- DropTable
DROP TABLE "public"."saas_customers";

-- DropEnum
DROP TYPE "public"."SubscriptionPlan";

-- AddForeignKey
ALTER TABLE "public"."customers" ADD CONSTRAINT "customers_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "public"."service_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "public"."service_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
