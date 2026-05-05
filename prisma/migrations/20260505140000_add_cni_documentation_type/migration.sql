-- Add CNI to TypeDocumentation enum
ALTER TYPE "public"."TypeDocumentation" ADD VALUE IF NOT EXISTS 'CNI';
