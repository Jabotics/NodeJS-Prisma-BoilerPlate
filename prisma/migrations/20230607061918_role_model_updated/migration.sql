/*
  Warnings:

  - Added the required column `code` to the `Role` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Brand" ALTER COLUMN "status" SET DEFAULT true;

-- AlterTable
ALTER TABLE "OwnedVehicles" ALTER COLUMN "status" SET DEFAULT true;

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "code" VARCHAR(50) NOT NULL,
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Vehicle" ALTER COLUMN "status" SET DEFAULT true;
