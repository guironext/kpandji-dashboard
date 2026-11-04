export const NIVEAUX_DOSSIER = [
  { id: "ouverture", label: "Ouverture" },
  { id: "visite", label: "Visite et échange" },
  { id: "proforma", label: "Proforma" },
  { id: "reponse", label: "Réponse client" },
  { id: "paiement", label: "Paiement" },
  { id: "autres-versements", label: "Autres versements" },
  { id: "montage", label: "Montage" },
  { id: "livraison", label: "Livraison" },
] as const;

export type NiveauDossierId = (typeof NIVEAUX_DOSSIER)[number]["id"];

export type DossierResponsableCard = {
  id: string;
  numero: string;
  nomCourt: string;
  prospectNom: string;
  prospectType: "CLIENT" | "ENTREPRISE";
  createdAt: string;
  commercialId: string;
  commercialNom: string;
  niveau: NiveauDossierId;
};
