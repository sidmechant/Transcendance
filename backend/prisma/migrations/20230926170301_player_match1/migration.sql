/*
  Warnings:

  - You are about to drop the column `userId` on the `Player` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Player" DROP CONSTRAINT "Player_userId_fkey";

-- DropIndex
DROP INDEX "Player_userId_key";

-- AlterTable
ALTER TABLE "Player" DROP COLUMN "userId";

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
