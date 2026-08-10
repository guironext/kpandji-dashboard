export type TaskStageId =
  | "EN_ATTENTE_DEBUT"
  | "DEBUT"
  | "EN_COURS"
  | "EN_ATTENTE_VALIDATION"
  | "VALIDEE"
  | "TERMINEE";

export type TaskStageStyle = {
  id: TaskStageId;
  label: string;
  colorHint: string;
  barClass: string;
  ringClass: string;
  badgeClass: string;
  dotClass: string;
  swatchClass: string;
};

/** Stages selectable from the Gantt bar dialog (background color → stage). */
export const GANTT_STAGE_PICKER_OPTIONS: TaskStageStyle[] = [
  {
    id: "EN_ATTENTE_DEBUT",
    label: "En attente de début",
    colorHint: "Gris",
    barClass: "bg-slate-400 hover:bg-slate-500",
    ringClass: "ring-slate-300",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-700",
    dotClass: "bg-slate-400",
    swatchClass: "bg-slate-400",
  },
  {
    id: "DEBUT",
    label: "Début",
    colorHint: "Bleu",
    barClass: "bg-blue-500 hover:bg-blue-600",
    ringClass: "ring-blue-300",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-800",
    dotClass: "bg-blue-500",
    swatchClass: "bg-blue-500",
  },
  {
    id: "EN_COURS",
    label: "En cours",
    colorHint: "Orange",
    barClass: "bg-orange-500 hover:bg-orange-600",
    ringClass: "ring-orange-300",
    badgeClass: "border-orange-200 bg-orange-50 text-orange-900",
    dotClass: "bg-orange-500",
    swatchClass: "bg-orange-500",
  },
  {
    id: "EN_ATTENTE_VALIDATION",
    label: "En attente de validation",
    colorHint: "Or",
    barClass: "bg-amber-400 hover:bg-amber-500",
    ringClass: "ring-amber-300",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-900",
    dotClass: "bg-amber-400",
    swatchClass: "bg-amber-400",
  },
];

const ALL_STAGE_STYLES: TaskStageStyle[] = [
  ...GANTT_STAGE_PICKER_OPTIONS,
  {
    id: "VALIDEE",
    label: "Validée",
    colorHint: "Vert",
    barClass: "bg-emerald-500 hover:bg-emerald-600",
    ringClass: "ring-emerald-300",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dotClass: "bg-emerald-500",
    swatchClass: "bg-emerald-500",
  },
  {
    id: "TERMINEE",
    label: "Terminée",
    colorHint: "Marron",
    barClass: "bg-[#6b4423] hover:bg-[#5a3a1e]",
    ringClass: "ring-[#6b4423]/40",
    badgeClass: "border-[#6b4423]/30 bg-[#ebe3d9] text-[#4a3520]",
    dotClass: "bg-[#6b4423]",
    swatchClass: "bg-[#6b4423]",
  },
];

export const ALL_TASK_STAGE_OPTIONS: TaskStageStyle[] = ALL_STAGE_STYLES;

export const TASK_STAGE_OPTIONS = GANTT_STAGE_PICKER_OPTIONS;

export function getTaskStageConfig(stage: TaskStageId): TaskStageStyle {
  return ALL_STAGE_STYLES.find((s) => s.id === stage) ?? GANTT_STAGE_PICKER_OPTIONS[0];
}

export function getTaskStageLabel(stage: TaskStageId): string {
  return getTaskStageConfig(stage).label;
}
