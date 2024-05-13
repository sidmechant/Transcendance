-- CreateEnum
CREATE TYPE "ChannelRole" AS ENUM ('MEMBER', 'ADMIN');

-- AlterTable
ALTER TABLE "ChannelMembership" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mutedUntil" TIMESTAMP(3),
ADD COLUMN     "role" "ChannelRole" NOT NULL DEFAULT 'MEMBER';
