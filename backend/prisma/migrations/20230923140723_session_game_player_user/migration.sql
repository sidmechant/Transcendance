/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `player1Id` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `player1Score` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `player2Id` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `player2Score` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `winnerId` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isTwoFactorAuthenticationEnabled` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumbers` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `twoFactorAuthenticationSecret` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - Added the required column `playerAId` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `playerBId` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sessionId` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `statut` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Game" DROP COLUMN "createdAt",
DROP COLUMN "player1Id",
DROP COLUMN "player1Score",
DROP COLUMN "player2Id",
DROP COLUMN "player2Score",
DROP COLUMN "winnerId",
ADD COLUMN     "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "playerAId" INTEGER NOT NULL,
ADD COLUMN     "playerBId" INTEGER NOT NULL,
ADD COLUMN     "scorePlayerA" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "scorePlayerB" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sessionId" INTEGER NOT NULL,
ADD COLUMN     "statut" TEXT NOT NULL,
ADD COLUMN     "updatedat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "isTwoFactorAuthenticationEnabled",
DROP COLUMN "phoneNumbers",
DROP COLUMN "twoFactorAuthenticationSecret",
DROP COLUMN "updatedAt",
ADD COLUMN     "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "istwofactorauthenticationenabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phonenumbers" TEXT,
ADD COLUMN     "twofactorauthenticationsecret" TEXT,
ADD COLUMN     "updatedat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "pseudo" TEXT NOT NULL,
    "photourl" TEXT NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishdat" TIMESTAMP(3) NOT NULL,
    "statut" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_pseudo_key" ON "Player"("pseudo");

-- CreateIndex
CREATE UNIQUE INDEX "Player_photourl_key" ON "Player"("photourl");
