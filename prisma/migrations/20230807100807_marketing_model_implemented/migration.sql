-- CreateEnum
CREATE TYPE "SocialMediaType" AS ENUM ('Youtube', 'Twitter', 'Facebook', 'INSTAGRAM');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('Image', 'Video');

-- CreateTable
CREATE TABLE "Marketing" (
    "id" BIGSERIAL NOT NULL,
    "socialMedia" "SocialMediaType" NOT NULL,
    "content" "ContentType" NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "softDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Marketing_pkey" PRIMARY KEY ("id")
);
