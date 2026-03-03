-- Mark all existing users as email-verified.
-- These users signed up before the verification feature existed.
UPDATE "User" SET "emailVerified" = true WHERE "emailVerified" = false;
