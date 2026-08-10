-- Align FK constraint names with Prisma's PostgreSQL identifier truncation rules.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ActiviteProjetActiviteRoutinee_projetActiviteRoutinee_fkey'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ActiviteProjetActiviteRoutinee_projetActiviteRoutineeId_fkey'
  ) THEN
    ALTER TABLE "ActiviteProjetActiviteRoutinee"
      RENAME CONSTRAINT "ActiviteProjetActiviteRoutinee_projetActiviteRoutinee_fkey"
      TO "ActiviteProjetActiviteRoutinee_projetActiviteRoutineeId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ProjetActiviteRoutineeResponsable_projetActiviteRoutinee_fkey'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ProjetActiviteRoutineeResponsable_projetActiviteRoutineeId_fkey'
  ) THEN
    ALTER TABLE "ProjetActiviteRoutineeResponsable"
      RENAME CONSTRAINT "ProjetActiviteRoutineeResponsable_projetActiviteRoutinee_fkey"
      TO "ProjetActiviteRoutineeResponsable_projetActiviteRoutineeId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TacheProjetActiviteRoutinee_projetActiviteRoutinee_fkey'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TacheProjetActiviteRoutinee_projetActiviteRoutineeId_fkey'
  ) THEN
    ALTER TABLE "TacheProjetActiviteRoutinee"
      RENAME CONSTRAINT "TacheProjetActiviteRoutinee_projetActiviteRoutinee_fkey"
      TO "TacheProjetActiviteRoutinee_projetActiviteRoutineeId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TacheProjetActiviteRoutineeDocument_tacheProjetActiviteRoutinee'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TacheProjetActiviteRoutineeDocument_tacheProjetActiviteRou_fkey'
  ) THEN
    ALTER TABLE "TacheProjetActiviteRoutineeDocument"
      RENAME CONSTRAINT "TacheProjetActiviteRoutineeDocument_tacheProjetActiviteRoutinee"
      TO "TacheProjetActiviteRoutineeDocument_tacheProjetActiviteRou_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TacheProjetActiviteRoutineeMessage_tacheProjetActiviteRoutinee_'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TacheProjetActiviteRoutineeMessage_tacheProjetActiviteRout_fkey'
  ) THEN
    ALTER TABLE "TacheProjetActiviteRoutineeMessage"
      RENAME CONSTRAINT "TacheProjetActiviteRoutineeMessage_tacheProjetActiviteRoutinee_"
      TO "TacheProjetActiviteRoutineeMessage_tacheProjetActiviteRout_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TacheProjetActiviteRoutineeResponsable_tacheProjetActiviteRouti'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TacheProjetActiviteRoutineeResponsable_tacheProjetActivite_fkey'
  ) THEN
    ALTER TABLE "TacheProjetActiviteRoutineeResponsable"
      RENAME CONSTRAINT "TacheProjetActiviteRoutineeResponsable_tacheProjetActiviteRouti"
      TO "TacheProjetActiviteRoutineeResponsable_tacheProjetActivite_fkey";
  END IF;
END $$;
