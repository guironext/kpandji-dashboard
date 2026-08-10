import type { CommunicationProjectDetail } from "@/lib/actions/communication-project";
import {
  Search,
  Target,
  MessageSquare,
  Calendar,
  Play,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export const PROJECT_STEP_COLORS = [
  {
    gradient: "from-violet-500 to-purple-600",
    iconBox: "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30",
    accent: "text-violet-700",
    ring: "ring-violet-500/20",
    cardGlow: "shadow-violet-500/10",
    fieldBorder: "border-violet-100",
    fieldBg: "bg-violet-50/50",
    dot: "bg-violet-500",
  },
  {
    gradient: "from-amber-500 to-orange-500",
    iconBox: "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30",
    accent: "text-amber-700",
    ring: "ring-amber-500/20",
    cardGlow: "shadow-amber-500/10",
    fieldBorder: "border-amber-100",
    fieldBg: "bg-amber-50/50",
    dot: "bg-amber-500",
  },
  {
    gradient: "from-emerald-500 to-teal-500",
    iconBox: "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30",
    accent: "text-emerald-700",
    ring: "ring-emerald-500/20",
    cardGlow: "shadow-emerald-500/10",
    fieldBorder: "border-emerald-100",
    fieldBg: "bg-emerald-50/50",
    dot: "bg-emerald-500",
  },
  {
    gradient: "from-rose-500 to-pink-500",
    iconBox: "bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30",
    accent: "text-rose-700",
    ring: "ring-rose-500/20",
    cardGlow: "shadow-rose-500/10",
    fieldBorder: "border-rose-100",
    fieldBg: "bg-rose-50/50",
    dot: "bg-rose-500",
  },
  {
    gradient: "from-sky-500 to-blue-500",
    iconBox: "bg-gradient-to-br from-sky-500 to-blue-500 text-white shadow-lg shadow-sky-500/30",
    accent: "text-sky-700",
    ring: "ring-sky-500/20",
    cardGlow: "shadow-sky-500/10",
    fieldBorder: "border-sky-100",
    fieldBg: "bg-sky-50/50",
    dot: "bg-sky-500",
  },
  {
    gradient: "from-cyan-500 to-teal-500",
    iconBox: "bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30",
    accent: "text-cyan-700",
    ring: "ring-cyan-500/20",
    cardGlow: "shadow-cyan-500/10",
    fieldBorder: "border-cyan-100",
    fieldBg: "bg-cyan-50/50",
    dot: "bg-cyan-500",
  },
] as const;

export type ProjectSectionConfig = {
  id: number;
  title: string;
  subtitle: string;
  goal: string;
  icon: LucideIcon;
  fields: readonly { key: string; label: string }[];
};

export const PROJECT_SECTIONS: readonly ProjectSectionConfig[] = [
  {
    id: 1,
    title: "Analyse de la situation",
    subtitle: "Diagnostic",
    goal: "Savoir pourquoi communiquer et pour qui.",
    icon: Search,
    fields: [
      { key: "diagnosticContext", label: "Contexte, problème ou besoin" },
      { key: "diagnosticTarget", label: "Cible (public visé)" },
      { key: "diagnosticEnvironment", label: "Environnement (concurrence, marché, image)" },
      { key: "diagnosticForces", label: "Forces et faiblesses" },
    ],
  },
  {
    id: 2,
    title: "Définition des objectifs",
    subtitle: "Objectifs SMART",
    goal: "Définir ce qu'on veut atteindre.",
    icon: Target,
    fields: [{ key: "objectives", label: "Objectifs clairs et mesurables (SMART)" }],
  },
  {
    id: 3,
    title: "Définition de la stratégie",
    subtitle: "Stratégie",
    goal: "Décider comment on va communiquer.",
    icon: MessageSquare,
    fields: [
      { key: "strategyPositioning", label: "Positionnement et message principal" },
      { key: "strategyTargets", label: "Cibles prioritaires" },
      { key: "strategyChannels", label: "Canaux" },
    ],
  },
  {
    id: 4,
    title: "Plan d'action",
    subtitle: "Plan de communication",
    goal: "Organiser quoi faire, quand, et avec quels moyens.",
    icon: Calendar,
    fields: [
      { key: "actionPlan", label: "Actions à réaliser" },
      { key: "actionSupports", label: "Supports" },
      { key: "actionCalendar", label: "Calendrier" },
      { key: "actionBudget", label: "Budget et responsabilités" },
    ],
  },
  {
    id: 5,
    title: "Mise en œuvre",
    subtitle: "Réalisation",
    goal: "Passer à l'action.",
    icon: Play,
    fields: [
      { key: "implementationContent", label: "Création des contenus" },
      { key: "implementationLaunch", label: "Lancement des campagnes" },
      { key: "implementationTeams", label: "Coordination des équipes" },
    ],
  },
  {
    id: 6,
    title: "Évaluation des résultats",
    subtitle: "Suivi",
    goal: "Vérifier si le projet a réussi et améliorer la suite.",
    icon: BarChart3,
    fields: [
      { key: "evaluationMetrics", label: "Mesure d'efficacité" },
      { key: "evaluationComparison", label: "Comparaison avec les objectifs" },
      { key: "evaluationAdjustments", label: "Ajustements" },
    ],
  },
];

export function fieldHasValue(
  project: CommunicationProjectDetail,
  key: string
): boolean {
  const v = project[key as keyof CommunicationProjectDetail];
  return v != null && String(v).trim() !== "";
}

export function getProjectProgress(project: CommunicationProjectDetail) {
  const allFields = PROJECT_SECTIONS.flatMap((s) => s.fields.map((f) => f.key));
  const filled = allFields.filter((k) => fieldHasValue(project, k)).length;
  const total = allFields.length;
  const percent = total > 0 ? Math.round((filled / total) * 100) : 0;
  return { filled, total, percent };
}

export type SectionStatus = {
  id: number;
  filled: number;
  total: number;
  hasContent: boolean;
  complete: boolean;
};

export function getSectionStatuses(
  project: CommunicationProjectDetail
): SectionStatus[] {
  return PROJECT_SECTIONS.map((section) => {
    const filled = section.fields.filter((f) =>
      fieldHasValue(project, f.key)
    ).length;
    return {
      id: section.id,
      filled,
      total: section.fields.length,
      hasContent: filled > 0,
      complete: filled === section.fields.length && filled > 0,
    };
  });
}

export function projectHasAnyContent(project: CommunicationProjectDetail) {
  return PROJECT_SECTIONS.some((section) =>
    section.fields.some((f) => fieldHasValue(project, f.key))
  );
}
