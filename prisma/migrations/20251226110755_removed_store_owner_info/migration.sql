/*
  Warnings:

  - You are about to drop the column `country` on the `stores_info` table. All the data in the column will be lost.
  - You are about to drop the column `isAccountOwner` on the `stores_info` table. All the data in the column will be lost.
  - You are about to drop the column `ownerEmail` on the `stores_info` table. All the data in the column will be lost.
  - You are about to drop the column `ownerFirstName` on the `stores_info` table. All the data in the column will be lost.
  - You are about to drop the column `ownerLastName` on the `stores_info` table. All the data in the column will be lost.
  - You are about to drop the column `planName` on the `stores_info` table. All the data in the column will be lost.
  - You are about to drop the column `shopName` on the `stores_info` table. All the data in the column will be lost.
  - You are about to drop the column `storeEmail` on the `stores_info` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `stores_info` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "stores_info" DROP COLUMN "country",
DROP COLUMN "isAccountOwner",
DROP COLUMN "ownerEmail",
DROP COLUMN "ownerFirstName",
DROP COLUMN "ownerLastName",
DROP COLUMN "planName",
DROP COLUMN "shopName",
DROP COLUMN "storeEmail",
DROP COLUMN "timezone";
