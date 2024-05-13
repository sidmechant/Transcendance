/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `Player` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_profileurl_key";

-- CreateIndex
CREATE UNIQUE INDEX "Player_id_key" ON "Player"("id");
