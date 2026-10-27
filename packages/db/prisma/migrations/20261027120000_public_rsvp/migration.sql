-- CreateEnum
CREATE TYPE "GuestSource" AS ENUM ('INVITED', 'LINK');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "openRsvp" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "source" "GuestSource" NOT NULL DEFAULT 'INVITED';

