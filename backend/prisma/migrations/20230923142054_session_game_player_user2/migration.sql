/*
  Warnings:

  - You are about to drop the column `phonenumbers` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "phonenumbers",
ADD COLUMN     "phoneNumbers" TEXT;
