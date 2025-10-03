-- CreateEnum
CREATE TYPE "public"."CustomerType" AS ENUM ('DIRECT', 'REFERRED');

-- DropForeignKey
ALTER TABLE "public"."customers" DROP CONSTRAINT "customers_serviceProviderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."jobs" DROP CONSTRAINT "jobs_serviceProviderId_fkey";

-- AlterTable
ALTER TABLE "public"."customers" ADD COLUMN     "customerType" "public"."CustomerType" NOT NULL DEFAULT 'DIRECT',
ADD COLUMN     "referralNotes" TEXT,
ALTER COLUMN "serviceProviderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."jobs" ADD COLUMN     "equipmentModel" TEXT,
ADD COLUMN     "equipmentSerial" TEXT,
ADD COLUMN     "equipmentType" TEXT,
ALTER COLUMN "serviceProviderId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."customers" ADD CONSTRAINT "customers_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "public"."service_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "public"."service_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
