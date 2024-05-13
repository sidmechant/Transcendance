/*
  Warnings:

  - You are about to drop the column `photourl` on the `User` table. All the data in the column will be lost.
  - Changed the type of `role` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'STUDENT', 'ADMIN');

-- DropIndex
DROP INDEX "User_photourl_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "photourl",
ADD COLUMN     "isProfileUpdated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "urlPhotoProfile" TEXT,
DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL;
