-- People managers add, change and remove admins, the prayer team and members on /admin/people.
-- Off for everyone; the seed gives it to the first person when nobody has it yet.
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "canManagePeople" BOOLEAN NOT NULL DEFAULT false;

-- Removing an admin keeps their events: the creator becomes empty (it is never shown).
-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_createdById_fkey";

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "createdById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
