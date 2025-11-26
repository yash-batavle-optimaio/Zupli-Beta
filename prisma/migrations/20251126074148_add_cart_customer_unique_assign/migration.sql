/*
  Warnings:

  - A unique constraint covering the columns `[cartToken]` on the table `CartCustomer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CartCustomer_cartToken_key" ON "CartCustomer"("cartToken");
