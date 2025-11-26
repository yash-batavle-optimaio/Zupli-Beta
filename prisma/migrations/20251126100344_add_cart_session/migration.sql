/*
  Warnings:

  - You are about to drop the `CartCustomer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "CartCustomer";

-- CreateTable
CREATE TABLE "CartSession" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "cartKey" TEXT,
    "customerId" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CartSession_storeId_idx" ON "CartSession"("storeId");

-- CreateIndex
CREATE INDEX "CartSession_customerId_idx" ON "CartSession"("customerId");

-- CreateIndex
CREATE INDEX "CartSession_cartId_idx" ON "CartSession"("cartId");
