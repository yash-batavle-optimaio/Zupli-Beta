/*
  Warnings:

  - You are about to drop the column `billingCycle` on the `billing_orders` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `billing_orders` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "idx_billing_orders_store_cycle";

-- AlterTable
ALTER TABLE "billing_orders" DROP COLUMN "billingCycle",
DROP COLUMN "location";

-- CreateIndex
CREATE INDEX "idx_billing_orders_store_cycle" ON "billing_orders"("storeId", "createdAt");
