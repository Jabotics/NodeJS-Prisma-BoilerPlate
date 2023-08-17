-- CreateEnum
CREATE TYPE "InquiryType" AS ENUM ('Sales', 'Others', 'Purchase');

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "phone" VARCHAR NOT NULL,
    "type" "InquiryType" NOT NULL,
    "description" VARCHAR NOT NULL,
    "solved" BOOLEAN NOT NULL DEFAULT true,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "softDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);
