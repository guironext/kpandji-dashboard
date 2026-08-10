-- Remove duplicate / non-standard FK names left by db push + migration mix.

ALTER TABLE "TacheProjetActiviteRoutinee"
  DROP CONSTRAINT IF EXISTS "TacheProjetActiviteRoutinee_activiteProjetActiviteRoutineeId_fk";

ALTER TABLE "TacheProjetActiviteRoutinee"
  DROP CONSTRAINT IF EXISTS "TacheProjetActiviteRoutinee_activiteProjetActiviteRoutineeId_fkey";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TacheProjetActiviteRoutinee_projetActiviteRoutineeId_fkey'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TacheProjetActiviteRoutinee_projetActiviteRoutinee_fkey'
  ) THEN
    ALTER TABLE "TacheProjetActiviteRoutinee"
      RENAME CONSTRAINT "TacheProjetActiviteRoutinee_projetActiviteRoutineeId_fkey"
      TO "TacheProjetActiviteRoutinee_projetActiviteRoutinee_fkey";
  ELSIF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TacheProjetActiviteRoutinee_projetActiviteRoutineeId_fkey'
  ) AND EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TacheProjetActiviteRoutinee_projetActiviteRoutinee_fkey'
  ) THEN
    ALTER TABLE "TacheProjetActiviteRoutinee"
      DROP CONSTRAINT "TacheProjetActiviteRoutinee_projetActiviteRoutineeId_fkey";
  END IF;
END $$;

ALTER TABLE "TacheProjetActiviteRoutineeResponsable"
  DROP CONSTRAINT IF EXISTS "TacheProjetActiviteRoutineeResponsable_tacheProjetActiviteRouti";

ALTER TABLE "TacheProjetActiviteRoutineeResponsable"
  DROP CONSTRAINT IF EXISTS "TacheProjetActiviteRoutineeResponsable_tacheProjetActivite_fkey";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TacheProjetActiviteRoutineeResponsable_tacheProjetActiviteRoutinee_fkey'
  ) THEN
    ALTER TABLE "TacheProjetActiviteRoutineeResponsable"
      ADD CONSTRAINT "TacheProjetActiviteRoutineeResponsable_tacheProjetActiviteRoutinee_fkey"
      FOREIGN KEY ("tacheProjetActiviteRoutineeId")
      REFERENCES "TacheProjetActiviteRoutinee"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "TacheProjetActiviteRoutineeMessage"
  DROP CONSTRAINT IF EXISTS "TacheProjetActiviteRoutineeMessage_tacheProjetActiviteRout_fkey";

ALTER TABLE "TacheProjetActiviteRoutineeMessage"
  DROP CONSTRAINT IF EXISTS "TacheProjetActiviteRoutineeMessage_tacheProjetActiviteRoutineeI";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TacheProjetActiviteRoutineeMessage_tacheProjetActiviteRoutinee_fkey'
  ) THEN
    ALTER TABLE "TacheProjetActiviteRoutineeMessage"
      ADD CONSTRAINT "TacheProjetActiviteRoutineeMessage_tacheProjetActiviteRoutinee_fkey"
      FOREIGN KEY ("tacheProjetActiviteRoutineeId")
      REFERENCES "TacheProjetActiviteRoutinee"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "TacheProjetActiviteRoutineeDocument"
  DROP CONSTRAINT IF EXISTS "TacheProjetActiviteRoutineeDocument_tacheProjetActiviteRou_fkey";

ALTER TABLE "TacheProjetActiviteRoutineeDocument"
  DROP CONSTRAINT IF EXISTS "TacheProjetActiviteRoutineeDocument_tacheProjetActiviteRoutinee";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TacheProjetActiviteRoutineeDocument_tacheProjetActiviteRoutinee_fkey'
  ) THEN
    ALTER TABLE "TacheProjetActiviteRoutineeDocument"
      ADD CONSTRAINT "TacheProjetActiviteRoutineeDocument_tacheProjetActiviteRoutinee_fkey"
      FOREIGN KEY ("tacheProjetActiviteRoutineeId")
      REFERENCES "TacheProjetActiviteRoutinee"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ProjetActiviteRoutineeResponsable_projetActiviteRoutineeId_fkey'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ProjetActiviteRoutineeResponsable_projetActiviteRoutinee_fkey'
  ) THEN
    ALTER TABLE "ProjetActiviteRoutineeResponsable"
      RENAME CONSTRAINT "ProjetActiviteRoutineeResponsable_projetActiviteRoutineeId_fkey"
      TO "ProjetActiviteRoutineeResponsable_projetActiviteRoutinee_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ActiviteProjetActiviteRoutinee_projetActiviteRoutineeId_fkey'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ActiviteProjetActiviteRoutinee_projetActiviteRoutinee_fkey'
  ) THEN
    ALTER TABLE "ActiviteProjetActiviteRoutinee"
      RENAME CONSTRAINT "ActiviteProjetActiviteRoutinee_projetActiviteRoutineeId_fkey"
      TO "ActiviteProjetActiviteRoutinee_projetActiviteRoutinee_fkey";
  END IF;
END $$;
