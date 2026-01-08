-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('FLAT', 'PERCENT');

-- CreateTable
CREATE TABLE "store_discounts" (
    "id" BIGSERIAL NOT NULL,
    "storeId" TEXT NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "cycleStart" TIMESTAMP(3) NOT NULL,
    "cycleEnd" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_discounts_storeId_isActive_idx" ON "store_discounts"("storeId", "isActive");

-- CreateIndex
CREATE INDEX "store_discounts_storeId_cycleStart_cycleEnd_idx" ON "store_discounts"("storeId", "cycleStart", "cycleEnd");
