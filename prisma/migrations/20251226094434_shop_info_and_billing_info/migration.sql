-- CreateTable
CREATE TABLE "stores_info" (
    "id" BIGSERIAL NOT NULL,
    "storeId" TEXT NOT NULL,
    "firstInstalledAt" TIMESTAMP(3) NOT NULL,
    "lastInstalledAt" TIMESTAMP(3) NOT NULL,
    "trialUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stores_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_orders" (
    "id" BIGSERIAL NOT NULL,
    "storeId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "billingCycle" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "totalItems" INTEGER NOT NULL,
    "discountName" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "insertedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stores_info_storeId_key" ON "stores_info"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "billing_orders_orderId_key" ON "billing_orders"("orderId");

-- CreateIndex
CREATE INDEX "idx_billing_orders_store_cycle" ON "billing_orders"("storeId", "billingCycle");
