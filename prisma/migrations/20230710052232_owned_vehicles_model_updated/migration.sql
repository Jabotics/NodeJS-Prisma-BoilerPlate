/*
  Warnings:

  - The `vehicleInfo` column on the `OwnedVehicles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `pricePaid` on table `OwnedVehicles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `RTOLocation` on table `OwnedVehicles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `yearOfRegistration` on table `OwnedVehicles` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "OwnedVehicles" DROP CONSTRAINT "OwnedVehicles_userId_fkey";

-- AlterTable
ALTER TABLE "OwnedVehicles" ADD COLUMN     "images" JSON,
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "pricePaid" SET NOT NULL,
ALTER COLUMN "RTOLocation" SET NOT NULL,
DROP COLUMN "vehicleInfo",
ADD COLUMN     "vehicleInfo" JSON,
ALTER COLUMN "yearOfRegistration" SET NOT NULL,
ALTER COLUMN "vehicleDocument" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "OwnedVehicles" ADD CONSTRAINT "OwnedVehicles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
