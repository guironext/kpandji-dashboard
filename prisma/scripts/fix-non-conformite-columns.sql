-- Repair partial enum migration: store type/statut as TEXT (validated in app layer).
-- Safe to run multiple times.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'NonConformiteJuridique'
      AND column_name = 'typeNonConformite'
      AND udt_name <> 'text'
  ) THEN
    ALTER TABLE "NonConformiteJuridique"
      ALTER COLUMN "typeNonConformite" TYPE TEXT
      USING "typeNonConformite"::TEXT;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'NonConformiteJuridique'
      AND column_name = 'statutNonConformite'
      AND udt_name <> 'text'
  ) THEN
    ALTER TABLE "NonConformiteJuridique"
      ALTER COLUMN "statutNonConformite" TYPE TEXT
      USING "statutNonConformite"::TEXT;
  END IF;
END $$;

DROP TYPE IF EXISTS "StatutNonConformiteJuridique_old" CASCADE;
DROP TYPE IF EXISTS "TypeNonConformiteJuridique_old" CASCADE;
DROP TYPE IF EXISTS "StatutNonConformiteJuridique" CASCADE;
DROP TYPE IF EXISTS "TypeNonConformiteJuridique" CASCADE;
