/*
  Warnings:

  - You are about to alter the column `pricePaid` on the `OwnedVehicles` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Real`.
  - You are about to alter the column `expectedPrice` on the `OwnedVehicles` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Real`.
  - Added the required column `color` to the `OwnedVehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `distanceDriven` to the `OwnedVehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transmission` to the `OwnedVehicles` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Color" AS ENUM ('Red', 'Grey', 'Blue', 'Wine', 'Green', 'White', 'Beige', 'Black', 'Brown', 'Silver', 'Violet', 'Purple', 'Yellow', 'Golden', 'Bronze', 'Orange', 'Maroon');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('Manual', 'Automatic');

-- AlterTable
ALTER TABLE "OwnedVehicles" ADD COLUMN     "color" "Color" NOT NULL,
ADD COLUMN     "distanceDriven" REAL NOT NULL,
ADD COLUMN     "transmission" "TransmissionType" NOT NULL,
ALTER COLUMN "pricePaid" SET DATA TYPE REAL,
ALTER COLUMN "expectedPrice" SET DATA TYPE REAL;
