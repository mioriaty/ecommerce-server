-- Tạo partial unique index cho path và method khi deletedAt là null
CREATE UNIQUE INDEX permission_path_method_unique
ON "Permission" (path, method)
WHERE "deletedAt" IS NULL;
