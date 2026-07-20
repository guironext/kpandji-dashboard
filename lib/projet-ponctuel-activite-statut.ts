export type StatutProjetPonctuelActivite =
  | "NOUVEAU"
  | "EN_ATTENTE"
  | "EN_COURS"
  | "EN_ATTENTE_VALIDATION"
  | "VALIDEE"
  | "NON_VALIDEE"
  | "TRANSFEREE"
  | "TERMINEE"
  | "ANNULE";

export type ActiviteStatutColumn = {
  value: StatutProjetPonctuelActivite;
  label: string;
  shortLabel: string;
  progress: number;
  headerClass: string;
  dotClass: string;
  barClass: string;
};

export const ACTIVITE_STATUT_COLUMNS: ActiviteStatutColumn[] = [
  {
    value: "NOUVEAU",
    label: "Nouveau",
    shortLabel: "Nouveau",
    progress: 0,
    headerClass: "from-indigo-500/15 to-violet-500/5 border-indigo-200",
    dotClass: "bg-indigo-500",
    barClass: "bg-indigo-500",
  },
  {
    value: "EN_ATTENTE",
    label: "En attente",
    shortLabel: "Attente",
    progress: 10,
    headerClass: "from-slate-500/15 to-slate-400/5 border-slate-200",
    dotClass: "bg-slate-400",
    barClass: "bg-slate-400",
  },
  {
    value: "EN_COURS",
    label: "En cours",
    shortLabel: "Cours",
    progress: 30,
    headerClass: "from-sky-500/15 to-cyan-500/5 border-sky-200",
    dotClass: "bg-sky-500",
    barClass: "bg-sky-500",
  },
  {
    value: "EN_ATTENTE_VALIDATION",
    label: "En attente validation",
    shortLabel: "Validation",
    progress: 55,
    headerClass: "from-amber-500/15 to-orange-500/5 border-amber-200",
    dotClass: "bg-amber-500",
    barClass: "bg-amber-500",
  },
  {
    value: "VALIDEE",
    label: "Validée",
    shortLabel: "Validée",
    progress: 75,
    headerClass: "from-emerald-500/15 to-green-500/5 border-emerald-200",
    dotClass: "bg-emerald-500",
    barClass: "bg-emerald-500",
  },
  {
    value: "NON_VALIDEE",
    label: "Non validée",
    shortLabel: "Refusée",
    progress: 45,
    headerClass: "from-rose-500/15 to-pink-500/5 border-rose-200",
    dotClass: "bg-rose-500",
    barClass: "bg-rose-500",
  },
  {
    value: "TRANSFEREE",
    label: "Transférée",
    shortLabel: "Transférée",
    progress: 65,
    headerClass: "from-violet-500/15 to-purple-500/5 border-violet-200",
    dotClass: "bg-violet-500",
    barClass: "bg-violet-500",
  },
  {
    value: "TERMINEE",
    label: "Terminée",
    shortLabel: "Terminée",
    progress: 100,
    headerClass: "from-teal-500/15 to-emerald-500/5 border-teal-200",
    dotClass: "bg-teal-500",
    barClass: "bg-teal-500",
  },
  {
    value: "ANNULE",
    label: "Annulée",
    shortLabel: "Annulée",
    progress: 0,
    headerClass: "from-slate-400/15 to-slate-300/5 border-slate-200",
    dotClass: "bg-slate-300",
    barClass: "bg-slate-300",
  },
];

const STATUT_MAP = Object.fromEntries(
  ACTIVITE_STATUT_COLUMNS.map((c) => [c.value, c])
) as Record<StatutProjetPonctuelActivite, ActiviteStatutColumn>;

export function getActiviteStatutConfig(
  statut: StatutProjetPonctuelActivite
): ActiviteStatutColumn {
  return STATUT_MAP[statut] ?? STATUT_MAP.NOUVEAU;
}

export function getActiviteStatutProgress(statut: StatutProjetPonctuelActivite): number {
  return getActiviteStatutConfig(statut).progress;
}

export function getActiviteTimeProgress(
  dateDebut: string,
  dateCloture: string | null
): number | null {
  if (!dateCloture) return null;
  const start = new Date(dateDebut).getTime();
  const end = new Date(dateCloture).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  const now = Date.now();
  return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
}

export const ALL_STATUT_VALUES = ACTIVITE_STATUT_COLUMNS.map((c) => c.value);

export function isStatutProjetPonctuelActivite(
  value: string
): value is StatutProjetPonctuelActivite {
  return ALL_STATUT_VALUES.includes(value as StatutProjetPonctuelActivite);
}
