export const FINANCE_PROJET_STATUTS = [
  "BROUILLON",
  "EN_COURS",
  "EN_PAUSE",
  "VALIDE",
  "TERMINE",
  "ANNULE",
] as const;

export type StatutFinanceProjet = (typeof FINANCE_PROJET_STATUTS)[number];
