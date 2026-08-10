export function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function statutBadgeClass(statut: string) {
  if (["TERMINEE", "EXECUTE"].includes(statut)) {
    return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
  }
  if (["EN_COURS", "EN_TRAITEMENT", "AUDIENCE"].includes(statut)) {
    return "bg-sky-100 text-sky-800 hover:bg-sky-100";
  }
  if (["ANNULE", "NON_EXECUTE"].includes(statut)) {
    return "bg-rose-100 text-rose-800 hover:bg-rose-100";
  }
  return "bg-amber-100 text-amber-800 hover:bg-amber-100";
}

const TYPE_ACCENT: Record<string, string> = {
  CIVIL: "from-indigo-500 to-violet-600",
  COMMERCIAL: "from-violet-500 to-purple-600",
  SOCIAL: "from-rose-400 to-pink-500",
  ADMINISTRATIF: "from-indigo-600 to-purple-700",
  FISCAL: "from-amber-500 to-orange-600",
  PENAL: "from-red-500 to-rose-600",
};

export function typeAccentClass(type: string) {
  return TYPE_ACCENT[type] ?? "from-slate-500 to-slate-600";
}

export function typeBadgeClass(type: string) {
  const map: Record<string, string> = {
    CIVIL: "bg-indigo-100 text-indigo-800",
    COMMERCIAL: "bg-violet-100 text-violet-800",
    SOCIAL: "bg-rose-100 text-rose-800",
    ADMINISTRATIF: "bg-purple-100 text-purple-800",
    FISCAL: "bg-amber-100 text-amber-800",
    PENAL: "bg-red-100 text-red-800",
  };
  return map[type] ?? "bg-slate-100 text-slate-800";
}

export const TYPE_DOSSIER_OPTIONS = [
  "CIVIL",
  "COMMERCIAL",
  "SOCIAL",
  "ADMINISTRATIF",
  "FISCAL",
  "PENAL",
] as const;

export const STATUT_DOSSIER_OPTIONS = [
  "RECLAMATION",
  "MISE_EN_DEMEURE",
  "CONCILIATION",
  "MEDIATION",
  "ASSIGNATION",
  "AUDIENCE",
  "JUGEMENT",
  "APPEL",
  "EXECUTION",
  "EN_ATTENTE",
  "EN_TRAITEMENT",
  "EN_COURS",
  "TERMINEE",
  "ANNULE",
] as const;
