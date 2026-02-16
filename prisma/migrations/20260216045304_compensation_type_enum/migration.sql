/*
  Warnings:

  - The `compensationType` column on the `Show` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "CompensationType" AS ENUM ('DOOR_SPLIT', 'GUARANTEE', 'GUARANTEE_PLUS_DOOR_SPLIT', 'OTHER');

-- AlterTable
ALTER TABLE "Show" DROP COLUMN "compensationType",
ADD COLUMN     "compensationType" "CompensationType";
