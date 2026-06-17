export const TYPE_NON_CONFORMITE_OPTIONS = [
  { value: "JURIDIQUE", label: "Juridique" },
  { value: "REGLEMENTAIRE", label: "Réglementaire" },
  { value: "ENVIRONNEMENTALE", label: "Environnementale" },
  { value: "HSE", label: "HSE" },
  { value: "QUALITE", label: "Qualité" },
  { value: "DOCUMENTAIRE", label: "Documentaire" },
  { value: "CONTRACTUELLE", label: "Contractuelle" },
  { value: "DOUANIERE", label: "Douanière" },
  { value: "FISCALE", label: "Fiscale" },
  { value: "SOCIALE", label: "Sociale" },
] as const;

export const STATUT_NON_CONFORMITE_OPTIONS = [
  { value: "MINEURE", label: "Mineure" },
  { value: "MAJEURE", label: "Majeure" },
  { value: "CRITIQUE", label: "Critique" },
] as const;

export const TYPE_NON_CONFORMITE_VALUES = TYPE_NON_CONFORMITE_OPTIONS.map(
  (option) => option.value
) as [
  "JURIDIQUE",
  "REGLEMENTAIRE",
  "ENVIRONNEMENTALE",
  "HSE",
  "QUALITE",
  "DOCUMENTAIRE",
  "CONTRACTUELLE",
  "DOUANIERE",
  "FISCALE",
  "SOCIALE",
];

export const STATUT_NON_CONFORMITE_VALUES = STATUT_NON_CONFORMITE_OPTIONS.map(
  (option) => option.value
) as ["MINEURE", "MAJEURE", "CRITIQUE"];

export function getTypeNonConformiteLabel(value: string) {
  return (
    TYPE_NON_CONFORMITE_OPTIONS.find((option) => option.value === value)?.label ??
    value.replace(/_/g, " ")
  );
}

export function getStatutNonConformiteLabel(value: string) {
  return (
    STATUT_NON_CONFORMITE_OPTIONS.find((option) => option.value === value)?.label ??
    value.replace(/_/g, " ")
  );
}

export function typeNonConformiteBadgeClass(type: string) {
  const classes: Record<string, string> = {
    JURIDIQUE: "bg-violet-100 text-violet-700",
    REGLEMENTAIRE: "bg-indigo-100 text-indigo-700",
    ENVIRONNEMENTALE: "bg-emerald-100 text-emerald-700",
    HSE: "bg-orange-100 text-orange-700",
    QUALITE: "bg-sky-100 text-sky-700",
    DOCUMENTAIRE: "bg-slate-100 text-slate-700",
    CONTRACTUELLE: "bg-blue-100 text-blue-700",
    DOUANIERE: "bg-amber-100 text-amber-700",
    FISCALE: "bg-rose-100 text-rose-700",
    SOCIALE: "bg-teal-100 text-teal-700",
  };
  return classes[type] ?? "bg-amber-100 text-amber-700";
}

export function statutNonConformiteBadgeClass(statut: string) {
  const classes: Record<string, string> = {
    MINEURE: "bg-yellow-100 text-yellow-800",
    MAJEURE: "bg-orange-100 text-orange-800",
    CRITIQUE: "bg-red-100 text-red-800",
  };
  return classes[statut] ?? "bg-slate-100 text-slate-700";
}

export const PROBABILITE_RISQUE_OPTIONS = [
  { value: "FAIBLE", label: "Faible" },
  { value: "MOYENNE", label: "Moyenne" },
  { value: "ELEVEE", label: "Élevée" },
] as const;

export const IMPACT_RISQUE_OPTIONS = [
  { value: "FAIBLE", label: "Faible" },
  { value: "MOYEN", label: "Moyen" },
  { value: "ELEVE", label: "Élevé" },
  { value: "CRITIQUE", label: "Critique" },
] as const;

export const NIVEAU_RISQUE_OPTIONS = [
  { value: "FAIBLE", label: "Faible" },
  { value: "MODERE", label: "Modéré" },
  { value: "ELEVE", label: "Élevé" },
  { value: "CRITIQUE", label: "Critique" },
] as const;

export const PROBABILITE_RISQUE_VALUES = PROBABILITE_RISQUE_OPTIONS.map(
  (option) => option.value
) as ["FAIBLE", "MOYENNE", "ELEVEE"];

export const IMPACT_RISQUE_VALUES = IMPACT_RISQUE_OPTIONS.map(
  (option) => option.value
) as ["FAIBLE", "MOYEN", "ELEVE", "CRITIQUE"];

export const NIVEAU_RISQUE_VALUES = NIVEAU_RISQUE_OPTIONS.map(
  (option) => option.value
) as ["FAIBLE", "MODERE", "ELEVE", "CRITIQUE"];

export function getProbabiliteRisqueLabel(value: string) {
  return (
    PROBABILITE_RISQUE_OPTIONS.find((option) => option.value === value)?.label ??
    value.replace(/_/g, " ")
  );
}

export function getImpactRisqueLabel(value: string) {
  return (
    IMPACT_RISQUE_OPTIONS.find((option) => option.value === value)?.label ??
    value.replace(/_/g, " ")
  );
}

export function getNiveauRisqueLabel(value: string) {
  return (
    NIVEAU_RISQUE_OPTIONS.find((option) => option.value === value)?.label ??
    value.replace(/_/g, " ")
  );
}

export function niveauRisqueBadgeClass(niveau: string) {
  const classes: Record<string, string> = {
    FAIBLE: "bg-emerald-100 text-emerald-700",
    MODERE: "bg-yellow-100 text-yellow-800",
    ELEVE: "bg-orange-100 text-orange-800",
    CRITIQUE: "bg-red-100 text-red-800",
  };
  return classes[niveau] ?? "bg-slate-100 text-slate-700";
}

export const TYPE_FORMATION_OPTIONS = [
  { value: "INTERNE", label: "Interne" },
  { value: "EXTERNE", label: "Externe" },
  { value: "E_LEARNING", label: "E-learning" },
  { value: "PRESENTIEL", label: "Présentiel" },
  { value: "HYBRIDE", label: "Hybride" },
] as const;

export const TYPE_FORMATION_VALUES = TYPE_FORMATION_OPTIONS.map(
  (option) => option.value
) as ["INTERNE", "EXTERNE", "E_LEARNING", "PRESENTIEL", "HYBRIDE"];

export function getTypeFormationLabel(value: string) {
  return (
    TYPE_FORMATION_OPTIONS.find((option) => option.value === value)?.label ??
    value.replace(/_/g, " ")
  );
}

export function typeFormationBadgeClass(type: string) {
  const classes: Record<string, string> = {
    INTERNE: "bg-sky-100 text-sky-700",
    EXTERNE: "bg-indigo-100 text-indigo-700",
    E_LEARNING: "bg-violet-100 text-violet-700",
    PRESENTIEL: "bg-blue-100 text-blue-700",
    HYBRIDE: "bg-cyan-100 text-cyan-700",
  };
  return classes[type] ?? "bg-slate-100 text-slate-700";
}
