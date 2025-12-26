-- AlterTable
ALTER TABLE "stores_info" ADD COLUMN     "country" TEXT,
ADD COLUMN     "isAccountOwner" BOOLEAN,
ADD COLUMN     "ownerEmail" TEXT,
ADD COLUMN     "ownerFirstName" TEXT,
ADD COLUMN     "ownerLastName" TEXT,
ADD COLUMN     "planName" TEXT,
ADD COLUMN     "shopName" TEXT,
ADD COLUMN     "storeEmail" TEXT,
ADD COLUMN     "timezone" TEXT;
