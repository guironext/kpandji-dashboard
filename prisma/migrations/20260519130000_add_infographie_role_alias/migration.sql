-- Correct spelling (app previously used INFOGRAPHIE typo in Clerk metadata)
ALTER TYPE "public"."UserRole" ADD VALUE IF NOT EXISTS 'INFOGRAPHIE';
