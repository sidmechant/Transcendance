/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `Player` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Player" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Player_id_seq";

-- CreateIndex
CREATE UNIQUE INDEX "Player_id_key" ON "Player"("id");
