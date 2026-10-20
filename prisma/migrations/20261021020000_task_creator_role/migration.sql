ALTER TABLE "Task" ADD COLUMN "creatorRole" "Role";
UPDATE "Task" AS t SET "creatorRole" = m."role" FROM "Membership" AS m
WHERE t."organizationId" = m."organizationId" AND t."creatorId" = m."userId";
