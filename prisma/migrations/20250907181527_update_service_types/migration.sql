/*
  Warnings:

  - The values [MAINTENANCE,REPAIR,REPLACEMENT,INSTALLATION,INSPECTION,TESTING] on the enum `ServiceType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `priority` on the `jobs` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."ServiceType_new" AS ENUM ('BATTERY_INSPECTION', 'CHARGER_INSPECTION', 'BATTERY_CHARGER_INSPECTION', 'SUPPLY_FIT_BATTERY', 'SUPPLY_DELIVER_CHARGER', 'SUPPLY_FIT_CELLS', 'CHARGER_RENTAL', 'BATTERY_WATER_TOPPING', 'BATTERY_REPAIR', 'BATTERY_RENTAL', 'CHARGER_REPAIR', 'PARTS_ORDERED', 'SITE_SURVEY', 'DELIVERY', 'COLLECTION', 'OTHER');
ALTER TABLE "public"."jobs" ALTER COLUMN "serviceType" DROP DEFAULT;
ALTER TABLE "public"."jobs" ALTER COLUMN "serviceType" TYPE "public"."ServiceType_new" USING ("serviceType"::text::"public"."ServiceType_new");
ALTER TYPE "public"."ServiceType" RENAME TO "ServiceType_old";
ALTER TYPE "public"."ServiceType_new" RENAME TO "ServiceType";
DROP TYPE "public"."ServiceType_old";
ALTER TABLE "public"."jobs" ALTER COLUMN "serviceType" SET DEFAULT 'BATTERY_INSPECTION';
COMMIT;

-- AlterTable
ALTER TABLE "public"."jobs" DROP COLUMN "priority",
ALTER COLUMN "serviceType" SET DEFAULT 'BATTERY_INSPECTION';

-- DropEnum
DROP TYPE "public"."JobPriority";
