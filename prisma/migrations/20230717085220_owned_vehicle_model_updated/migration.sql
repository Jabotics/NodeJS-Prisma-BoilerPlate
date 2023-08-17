/*
  Warnings:

  - You are about to drop the column `userId` on the `OwnedVehicles` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "OwnedVehicles" DROP CONSTRAINT "OwnedVehicles_userId_fkey";

-- AlterTable
ALTER TABLE "OwnedVehicles" DROP COLUMN "userId";
