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
