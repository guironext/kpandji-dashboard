-- Set NOUVEAU as default for new activities (separate migration after enum value exists).
ALTER TABLE "ProjetPonctuelActivite"
ALTER COLUMN "statutActivite" SET DEFAULT 'NOUVEAU';
