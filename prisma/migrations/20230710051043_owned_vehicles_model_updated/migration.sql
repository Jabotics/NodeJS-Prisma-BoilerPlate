/*
  Warnings:

  - Added the required column `vehicleDocument` to the `OwnedVehicles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OwnedVehicles" DROP COLUMN "vehicleDocument",
ADD COLUMN     "vehicleDocument" JSON NOT NULL;
