-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('CNG', 'Petrol', 'Diesel');

-- CreateEnum
CREATE TYPE "BodyType" AS ENUM ('SUV', 'MUV', 'Sedan', 'Hatchback');

-- CreateEnum
CREATE TYPE "VerificationTypeEnum" AS ENUM ('Forget Password', 'Generate Password', 'User Registration', 'Email Verification');

-- CreateTable
CREATE TABLE "Brand" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "softDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" BIGSERIAL NOT NULL,
    "brandId" BIGINT NOT NULL,
    "modelId" VARCHAR(50) NOT NULL,
    "modelName" VARCHAR(100) NOT NULL,
    "bodyType" "BodyType" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "softDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" BIGSERIAL NOT NULL,
    "componentName" VARCHAR NOT NULL,
    "createdDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roles" (
    "id" BIGSERIAL NOT NULL,
    "permissionId" BIGINT NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "add" BOOLEAN NOT NULL DEFAULT false,
    "update" BOOLEAN NOT NULL DEFAULT false,
    "delete" BOOLEAN NOT NULL DEFAULT false,
    "view" BOOLEAN NOT NULL DEFAULT false,
    "createdDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" BIGSERIAL NOT NULL,
    "rolesId" BIGINT,
    "email" VARCHAR(50) NOT NULL,
    "password" VARCHAR(500),
    "firstName" VARCHAR(25),
    "middleName" VARCHAR(25),
    "lastName" VARCHAR(25),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isSubAdmin" BOOLEAN NOT NULL DEFAULT false,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "mobile" VARCHAR(15),
    "userInfo" JSON,
    "bankInfo" JSON,
    "softDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "type" "VerificationTypeEnum" NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "softDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlacklistToken" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "createdDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "BlacklistToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnedVehicles" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "vehicleId" BIGINT NOT NULL,
    "pricePaid" DOUBLE PRECISION,
    "expectedPrice" DOUBLE PRECISION,
    "vehicleDocument" VARCHAR(500),
    "RTOLocation" VARCHAR(500),
    "vehicleInfo" VARCHAR(1000),
    "yearOfRegistration" TIMESTAMPTZ,
    "expectedDateOfSell" TIMESTAMPTZ,
    "dateOfSell" TIMESTAMPTZ,
    "sellingDate" TIMESTAMPTZ,
    "wantToSell" BOOLEAN NOT NULL DEFAULT false,
    "sold" BOOLEAN NOT NULL DEFAULT false,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "softDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnedVehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Permission_componentName_key" ON "Permission"("componentName");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_token_key" ON "Verification"("token");

-- CreateIndex
CREATE UNIQUE INDEX "BlacklistToken_token_key" ON "BlacklistToken"("token");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roles" ADD CONSTRAINT "Roles_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_rolesId_fkey" FOREIGN KEY ("rolesId") REFERENCES "Roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlacklistToken" ADD CONSTRAINT "BlacklistToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnedVehicles" ADD CONSTRAINT "OwnedVehicles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnedVehicles" ADD CONSTRAINT "OwnedVehicles_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
