/*
  Warnings:

  - You are about to drop the column `createdat` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `photourl` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `updatedat` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the `Game` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `urlPhotoProfile` to the `Player` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `Player` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Player_photourl_key";

-- DropIndex
DROP INDEX "Player_pseudo_key";

-- AlterTable
ALTER TABLE "Player" DROP COLUMN "createdat",
DROP COLUMN "photourl",
DROP COLUMN "updatedat",
ADD COLUMN     "urlPhotoProfile" TEXT NOT NULL,
ALTER COLUMN "userId" SET NOT NULL;

-- DropTable
DROP TABLE "Game";

-- DropTable
DROP TABLE "Session";

-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "playerAId" INTEGER NOT NULL,
    "playerBId" INTEGER NOT NULL,
    "scoreA" INTEGER NOT NULL,
    "scoreB" INTEGER NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_playerAId_fkey" FOREIGN KEY ("playerAId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_playerBId_fkey" FOREIGN KEY ("playerBId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
