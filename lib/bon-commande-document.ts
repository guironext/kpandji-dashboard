export type BonCommandeContenu = {
  siege: string;
  banque: string;
  numero: string;
  date: string;
  conseillerNom: string;
  matricule: string;
  conseillerTel: string;
  nomParticulier: string;
  cni: string;
  denomination: string;
  rccm: string;
  ncc: string;
  representant: string;
  adresseParticulier: string;
  adresseEntreprise: string;
  contactParticulier: string;
  contactEntreprise: string;
  carteParticulier: string;
  carteEntreprise: string;
  modele: string;
  carrosserie: string;
  motorisation: string;
  cv: string;
  couleur: string;
  annee: string;
  homologation: string;
  quantite: string;
  vin: string;
  opt1: string;
  qte1: string;
  pu1: string;
  mt1: string;
  opt2: string;
  qte2: string;
  pu2: string;
  mt2: string;
  livQte: string;
  livPu: string;
  livMt: string;
  remisePct: string;
  vehiculeHt: string;
  optionsHt: string;
  remiseMontant: string;
  totalHt: string;
  tva: string;
  totalTtc: string;
  net: string;
  lettres: string;
  acompte1: string;
  recu1: string;
  acompte2: string;
  recu2: string;
  solde: string;
  recuSolde: string;
  organisme: string;
  montantFinance: string;
  dateAccord: string;
  dateLivraison: string;
  autreLieu: string;
  receptionnaire: string;
  pieceReception: string;
  faitA: string;
  faitLe: string;
  signatureClient: string;
  signatureConseiller: string;
  lieu: string;
  qualite: string;
  reglement: string;
  financement: string;
  livraison: string;
  horsEtablissement: boolean;
  etapeValidation?: "" | "A_VALIDER" | "EN_VALIDATION" | "SOUS_RESERVE" | "VALIDE";
};

const TEXT_KEYS: Array<keyof BonCommandeContenu> = [
  "siege", "banque", "numero", "date", "conseillerNom", "matricule", "conseillerTel",
  "nomParticulier", "cni", "denomination", "rccm", "ncc", "representant",
  "adresseParticulier", "adresseEntreprise", "contactParticulier", "contactEntreprise",
  "carteParticulier", "carteEntreprise", "modele", "carrosserie", "motorisation", "cv",
  "couleur", "annee", "homologation", "quantite", "vin", "opt1", "qte1", "pu1", "mt1",
  "opt2", "qte2", "pu2", "mt2", "livQte", "livPu", "livMt", "remisePct", "vehiculeHt",
  "optionsHt", "remiseMontant", "totalHt", "tva", "totalTtc", "net", "lettres",
  "acompte1", "recu1", "acompte2", "recu2", "solde", "recuSolde", "organisme",
  "montantFinance", "dateAccord", "dateLivraison", "autreLieu", "receptionnaire",
  "pieceReception", "faitA", "faitLe", "signatureClient", "signatureConseiller",
  "lieu", "qualite", "reglement", "financement", "livraison",
];

export function parseBonCommandeContenu(value: unknown): BonCommandeContenu | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.siege !== "string" || typeof record.banque !== "string") return null;
  const contenu = {} as BonCommandeContenu;
  for (const key of TEXT_KEYS) {
    const item = record[key];
    (contenu[key] as string) = typeof item === "string" ? item : "";
  }
  contenu.horsEtablissement = record.horsEtablissement === true;
  const etape = record.etapeValidation;
  contenu.etapeValidation =
    etape === "A_VALIDER" || etape === "EN_VALIDATION" || etape === "SOUS_RESERVE" || etape === "VALIDE"
      ? etape
      : "";
  return contenu;
}
