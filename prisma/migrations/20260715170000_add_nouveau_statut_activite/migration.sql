-- Add NOUVEAU as first activity status.
-- Must be in its own migration: PostgreSQL cannot use a new enum value in the same transaction.
ALTER TYPE "StatutProjetPonctuelActivite" ADD VALUE IF NOT EXISTS 'NOUVEAU' BEFORE 'EN_ATTENTE';
