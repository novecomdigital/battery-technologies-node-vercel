/*
  Warnings:

  - The values [PENDING,IN_PROGRESS,COMPLETED] on the enum `JobStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."JobStatus_new" AS ENUM ('OPEN', 'COMPLETE', 'VISITED', 'NEEDS_QUOTE', 'ON_HOLD', 'CANCELLED');
ALTER TABLE "public"."jobs" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."jobs" ALTER COLUMN "status" TYPE "public"."JobStatus_new" USING ("status"::text::"public"."JobStatus_new");
ALTER TYPE "public"."JobStatus" RENAME TO "JobStatus_old";
ALTER TYPE "public"."JobStatus_new" RENAME TO "JobStatus";
DROP TYPE "public"."JobStatus_old";
ALTER TABLE "public"."jobs" ALTER COLUMN "status" SET DEFAULT 'OPEN';
COMMIT;

-- AlterTable
ALTER TABLE "public"."jobs" ALTER COLUMN "status" SET DEFAULT 'OPEN';
