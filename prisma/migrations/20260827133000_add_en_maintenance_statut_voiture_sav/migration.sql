-- Prisma db push does not always add new PostgreSQL enum values.
-- Studio/API fail with: invalid input value for enum "StatutVoitureSAV": "EN_MAINTENANCE"

ALTER TYPE "public"."StatutVoitureSAV" ADD VALUE IF NOT EXISTS 'EN_MAINTENANCE';
