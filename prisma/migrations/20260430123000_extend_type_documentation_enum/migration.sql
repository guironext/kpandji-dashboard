-- Extend TypeDocumentation for commercial documentation tabs (Catalogue, Presentation, Fiche Technique)
DO $$
BEGIN
  -- Some environments were missing the enum in migration history; ensure it exists
  -- so shadow-database validation can apply cleanly.
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'TypeDocumentation' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "public"."TypeDocumentation" AS ENUM (
      'AGREMENT',
      'ARF',
      'RCCM',
      'DFE',
      'CNPS',
      'RIB',
      'CATALOGUE',
      'PRESENTATION',
      'FICHE_TECHNIQUE'
    );
  END IF;
END
$$;

ALTER TYPE "public"."TypeDocumentation" ADD VALUE IF NOT EXISTS 'CATALOGUE';
ALTER TYPE "public"."TypeDocumentation" ADD VALUE IF NOT EXISTS 'PRESENTATION';
ALTER TYPE "public"."TypeDocumentation" ADD VALUE IF NOT EXISTS 'FICHE_TECHNIQUE';
