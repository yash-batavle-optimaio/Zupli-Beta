-- CreateTable
CREATE TABLE "store_usage" (
    "id" BIGSERIAL NOT NULL,
    "storeId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "currentCycleStart" TIMESTAMP(3) NOT NULL,
    "currentCycleEnd" TIMESTAMP(3) NOT NULL,
    "ordersCount" INTEGER NOT NULL DEFAULT 0,
    "usageAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_usage_storeId_key" ON "store_usage"("storeId");

-- CreateIndex
CREATE INDEX "store_usage_storeId_idx" ON "store_usage"("storeId");
