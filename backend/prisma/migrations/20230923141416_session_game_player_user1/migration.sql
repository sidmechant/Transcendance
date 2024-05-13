/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `istwofactorauthenticationenabled` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `twofactorauthenticationsecret` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Game" DROP COLUMN "createdAt",
ADD COLUMN     "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "istwofactorauthenticationenabled",
DROP COLUMN "twofactorauthenticationsecret",
ADD COLUMN     "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isTwoFactorAuthenticationEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorAuthenticationSecret" TEXT;
