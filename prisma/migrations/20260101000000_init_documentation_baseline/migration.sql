-- Idempotent baseline: ensures the TypeDocumentation enum and Documentation table
-- exist before later migrations alter them. The original objects were created
-- via `prisma db push` and were missing from the migration history, which broke
-- shadow-database validation.

DO $$
BEGIN
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
      'RIB'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "public"."Documentation" (
  "id" TEXT NOT NULL,
  "nom" TEXT NOT NULL,
  "type" "public"."TypeDocumentation" NOT NULL,
  "fichier" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Documentation_pkey" PRIMARY KEY ("id")
);
