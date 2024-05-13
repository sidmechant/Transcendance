/*
  Warnings:

  - You are about to drop the column `createdat` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `createdat` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Game" DROP COLUMN "createdat",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedat" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Player" ALTER COLUMN "updatedat" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "updatedat" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdat",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedat" DROP DEFAULT;
