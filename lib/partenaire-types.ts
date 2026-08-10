export const TYPE_PARTENAIRE_VALUES = [
  "FOURNISSEUR",
  "CLIENT",
  "PARTENAIRE",
] as const;

export type TypePartenaire = (typeof TYPE_PARTENAIRE_VALUES)[number];

export function isTypePartenaire(s: string): s is TypePartenaire {
  return (TYPE_PARTENAIRE_VALUES as readonly string[]).includes(s);
}

export type PartenaireFormInput = {
  nom: string;
  email?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  ville?: string | null;
  code_postal?: string | null;
  pays?: string | null;
  type_partenaire: TypePartenaire;
};
