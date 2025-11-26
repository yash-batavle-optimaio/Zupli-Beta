/*
  Warnings:

  - You are about to drop the `Shop` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Shop";

-- CreateTable
CREATE TABLE "CartCustomer" (
    "id" TEXT NOT NULL,
    "cartToken" TEXT NOT NULL,
    "customerId" TEXT,
    "email" TEXT,
    "storeId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartCustomer_pkey" PRIMARY KEY ("id")
);
