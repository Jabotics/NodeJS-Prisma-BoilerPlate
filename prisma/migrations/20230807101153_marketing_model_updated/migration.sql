/*
  Warnings:

  - Added the required column `url` to the `Marketing` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Marketing" ADD COLUMN     "url" VARCHAR NOT NULL;
