-- Extend TypeDocumentation for commercial documentation tabs (Catalogue, Presentation, Fiche Technique)
ALTER TYPE "public"."TypeDocumentation" ADD VALUE 'CATALOGUE';
ALTER TYPE "public"."TypeDocumentation" ADD VALUE 'PRESENTATION';
ALTER TYPE "public"."TypeDocumentation" ADD VALUE 'FICHE_TECHNIQUE';
