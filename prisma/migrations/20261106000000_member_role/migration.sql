-- Members can sign in to see the serving schedule, nothing else.
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'MEMBER';

-- No default role: every new account must say whether it's an admin or a member.
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
