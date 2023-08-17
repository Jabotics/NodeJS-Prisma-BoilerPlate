/*
  Warnings:

  - Made the column `userId` on table `OwnedVehicles` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "OwnedVehicles" DROP CONSTRAINT "OwnedVehicles_userId_fkey";

-- AlterTable
ALTER TABLE "OwnedVehicles" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "OwnedVehicles" ADD CONSTRAINT "OwnedVehicles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
