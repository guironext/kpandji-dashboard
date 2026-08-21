-- StatutVoitureSAV was extended via db push on some environments.
-- Keep shadow/fresh DBs and migrate deploy in sync.

ALTER TYPE "public"."StatutVoitureSAV" ADD VALUE IF NOT EXISTS 'DIAGNOSTIC_FINI';
ALTER TYPE "public"."StatutVoitureSAV" ADD VALUE IF NOT EXISTS 'DISPATCHE';
ALTER TYPE "public"."StatutVoitureSAV" ADD VALUE IF NOT EXISTS 'GARANTIESAV_EN_COURS';
ALTER TYPE "public"."StatutVoitureSAV" ADD VALUE IF NOT EXISTS 'GARANTIESAV_TERMINE';
