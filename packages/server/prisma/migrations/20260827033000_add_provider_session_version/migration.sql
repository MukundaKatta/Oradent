-- Additive-only migration: adds Provider.sessionVersion, defaulting existing
-- rows to 1. Backs the fix for logout/password-change not invalidating
-- outstanding refresh tokens (previously only the access token was
-- blacklisted, so a stolen or leaked refresh token kept working after
-- logout or a password reset).

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 1;
