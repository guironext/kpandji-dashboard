export const BARRIERES_DECISION = [
  "Budget insuffisant",
  "Apport initial trop élevé",
  "Mensualités trop importantes",
  "Manque de confiance envers la marque",
  "Doute sur la qualité du véhicule",
  "Incertitude sur la garantie et le SAV",
  "Délai de livraison trop long",
  "Véhicule indisponible",
  "Offre concurrente plus attractive",
  "Absence du décideur final",
  "Dossier administratif incomplet",
  "Autre obstacle",
] as const;

export const CONCLUSION_CRITERES = [
  { id: "besoinIdentifie", label: "Besoin du client clairement identifié" },
  { id: "budgetConnu", label: "Budget connu" },
  { id: "vehiculeAdapte", label: "Véhicule adapté proposé" },
  { id: "modePaiementDefini", label: "Mode de paiement défini" },
  { id: "objectionsIdentifiees", label: "Objections identifiées" },
  { id: "intentionAchat", label: "Intention d'achat confirmée" },
  { id: "prochaineRencontre", label: "Prochaine rencontre programmée" },
] as const;

export type ConclusionKey = (typeof CONCLUSION_CRITERES)[number]["id"];
export type ConclusionProspect = Record<ConclusionKey, boolean>;

export function emptyConclusion(): Record<ConclusionKey, boolean | null> {
  return {
    besoinIdentifie: null,
    budgetConnu: null,
    vehiculeAdapte: null,
    modePaiementDefini: null,
    objectionsIdentifiees: null,
    intentionAchat: null,
    prochaineRencontre: null,
  };
}

export function readConclusion(value: unknown): ConclusionProspect | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const out = emptyConclusion();
  for (const critere of CONCLUSION_CRITERES) {
    if (typeof row[critere.id] !== "boolean") return null;
    out[critere.id] = row[critere.id] as boolean;
  }
  return out as ConclusionProspect;
}
