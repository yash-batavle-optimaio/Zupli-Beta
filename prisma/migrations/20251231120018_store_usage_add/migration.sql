/*
  Warnings:

  - You are about to drop the column `currentCycleEnd` on the `store_usage` table. All the data in the column will be lost.
  - You are about to drop the column `currentCycleStart` on the `store_usage` table. All the data in the column will be lost.
  - Added the required column `cycleEnd` to the `store_usage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cycleStart` to the `store_usage` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "store_usage_storeId_key";

-- AlterTable
ALTER TABLE "store_usage" DROP COLUMN "currentCycleEnd",
DROP COLUMN "currentCycleStart",
ADD COLUMN     "cycleEnd" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "cycleStart" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'OPEN';

-- CreateIndex
CREATE INDEX "store_usage_storeId_cycleStart_idx" ON "store_usage"("storeId", "cycleStart");
