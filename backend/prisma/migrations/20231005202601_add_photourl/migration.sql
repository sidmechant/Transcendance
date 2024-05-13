/*
  Warnings:

  - Made the column `photourl` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "photourl" SET NOT NULL;
