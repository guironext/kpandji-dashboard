export type ContratVenteContenu = {
  siege: string;
  banque: string;
  raison: string;
  rccm: string;
  adresseVendeur: string;
  acheteur: string;
  piece: string;
  adresseAcheteur: string;
  marque: string;
  modele: string;
  genre: string;
  energie: string;
  puissance: string;
  couleur: string;
  montant: string;
  pourcentageAcompte: string;
  acompte: string;
  solde: string;
  faitA: string;
  faitLe: string;
  etabli: boolean;
  etapeValidation: "" | "A_VALIDER" | "EN_VALIDATION" | "SOUS_RESERVE" | "VALIDE";
};

type TextKey = Exclude<
  {
    [K in keyof ContratVenteContenu]: ContratVenteContenu[K] extends string ? K : never;
  }[keyof ContratVenteContenu],
  "etapeValidation"
>;

const KEYS: TextKey[] = [
  "siege",
  "banque",
  "raison",
  "rccm",
  "adresseVendeur",
  "acheteur",
  "piece",
  "adresseAcheteur",
  "marque",
  "modele",
  "genre",
  "energie",
  "puissance",
  "couleur",
  "montant",
  "pourcentageAcompte",
  "acompte",
  "solde",
  "faitA",
  "faitLe",
];

export function parseContratVenteContenu(value: unknown): ContratVenteContenu | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.raison !== "string" || typeof record.acheteur !== "string") return null;
  const contenu = {} as ContratVenteContenu;
  for (const key of KEYS) {
    const item = record[key];
    contenu[key] = typeof item === "string" ? item : "";
  }
  contenu.etabli = record.etabli === true;
  const etape = record.etapeValidation;
  contenu.etapeValidation =
    etape === "A_VALIDER" || etape === "EN_VALIDATION" || etape === "SOUS_RESERVE" || etape === "VALIDE"
      ? etape
      : "";
  return contenu;
}
