/*
  Warnings:

  - Changed the type of `yearOfRegistration` on the `OwnedVehicles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "OwnedVehicles" DROP COLUMN "yearOfRegistration",
ADD COLUMN     "yearOfRegistration" INTEGER NOT NULL;
