-- CreateEnum
CREATE TYPE "AvatarSource" AS ENUM ('UPLOAD', 'S3', 'SOCIAL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarSource" "AvatarSource",
ADD COLUMN     "avatarUpdatedAt" TIMESTAMP(3);
