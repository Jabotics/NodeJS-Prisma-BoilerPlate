/*
  Warnings:

  - You are about to drop the column `url` on the `Marketing` table. All the data in the column will be lost.
  - Added the required column `link` to the `Marketing` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Marketing" DROP COLUMN "url",
ADD COLUMN     "link" VARCHAR NOT NULL;
