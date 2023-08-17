-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "logo" VARCHAR;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "displayImage" VARCHAR,
ADD COLUMN     "images" JSON;
