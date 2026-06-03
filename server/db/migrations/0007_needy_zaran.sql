ALTER TABLE "user" ALTER COLUMN "emailVerified" SET DATA TYPE boolean USING
  CASE WHEN "emailVerified" IS NULL THEN false
       ELSE true END;
-- rollback: ALTER TABLE "user" ALTER COLUMN "emailVerified" SET DATA TYPE timestamp with time zone USING NULL;