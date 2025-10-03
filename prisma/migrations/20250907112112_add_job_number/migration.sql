/*
  Warnings:

  - A unique constraint covering the columns `[jobNumber]` on the table `jobs` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `jobNumber` to the `jobs` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add the column as nullable first
ALTER TABLE "public"."jobs" ADD COLUMN "jobNumber" TEXT;

-- Step 2: Populate jobNumber for existing records using a sequence
DO $$
DECLARE
    job_record RECORD;
    counter INTEGER := 1;
BEGIN
    FOR job_record IN SELECT id FROM "public"."jobs" ORDER BY "createdAt" LOOP
        UPDATE "public"."jobs" 
        SET "jobNumber" = 'JOB-' || LPAD(counter::text, 4, '0')
        WHERE id = job_record.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- Step 3: Make the column NOT NULL
ALTER TABLE "public"."jobs" ALTER COLUMN "jobNumber" SET NOT NULL;

-- Step 4: Create unique index
CREATE UNIQUE INDEX "jobs_jobNumber_key" ON "public"."jobs"("jobNumber");
