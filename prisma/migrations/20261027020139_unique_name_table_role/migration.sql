-- DropIndex
DROP INDEX "Role_name_key";

CREATE UNIQUE INDEX Role_name_key
ON "Role" (name)
WHERE "deletedAt" IS NULL;
