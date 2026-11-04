-- Add Condition Générales de vente to TypeDocumentation
ALTER TYPE "public"."TypeDocumentation" ADD VALUE IF NOT EXISTS 'CONDITION_GENERALES_DE_VENTE';
