import { getCommunicationProjectById } from "@/lib/actions/communication-project";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Search,
  Target,
  MessageSquare,
  Calendar,
  Play,
  BarChart3,
  User,
  ChevronRight,
  FileText,
} from "lucide-react";

const SECTIONS = [
  {
    id: 1,
    title: "Analyse de la situation (diagnostic)",
    goal: "Savoir pourquoi communiquer et pour qui.",
    icon: Search,
    iconBox: "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30",
    cardBorder: "border-l-4 border-l-indigo-500",
    cardBg: "bg-indigo-50/40",
    fieldBg: "bg-white/80 border-indigo-100",
    labelColor: "text-indigo-700",
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
    goal: "Définir ce qu'on veut atteindre.",
    icon: Target,
    iconBox: "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30",
    cardBorder: "border-l-4 border-l-cyan-500",
    cardBg: "bg-cyan-50/40",
    fieldBg: "bg-white/80 border-cyan-100",
    labelColor: "text-cyan-700",
    fields: [{ key: "objectives", label: "Objectifs clairs et mesurables (SMART)" }],
  },
  {
    id: 3,
    title: "Définition de la stratégie",
    goal: "Décider comment on va communiquer.",
    icon: MessageSquare,
    iconBox: "bg-violet-500 text-white shadow-lg shadow-violet-500/30",
    cardBorder: "border-l-4 border-l-violet-500",
    cardBg: "bg-violet-50/40",
    fieldBg: "bg-white/80 border-violet-100",
    labelColor: "text-violet-700",
    fields: [
      { key: "strategyPositioning", label: "Positionnement et message principal" },
      { key: "strategyTargets", label: "Cibles prioritaires" },
      { key: "strategyChannels", label: "Canaux" },
    ],
  },
  {
    id: 4,
    title: "Plan d'action",
    goal: "Organiser quoi faire, quand, et avec quels moyens.",
    icon: Calendar,
    iconBox: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30",
    cardBorder: "border-l-4 border-l-emerald-500",
    cardBg: "bg-emerald-50/40",
    fieldBg: "bg-white/80 border-emerald-100",
    labelColor: "text-emerald-700",
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
    goal: "Passer à l'action.",
    icon: Play,
    iconBox: "bg-amber-500 text-white shadow-lg shadow-amber-500/30",
    cardBorder: "border-l-4 border-l-amber-500",
    cardBg: "bg-amber-50/40",
    fieldBg: "bg-white/80 border-amber-100",
    labelColor: "text-amber-700",
    fields: [
      { key: "implementationContent", label: "Création des contenus" },
      { key: "implementationLaunch", label: "Lancement des campagnes" },
      { key: "implementationTeams", label: "Coordination des équipes" },
    ],
  },
  {
    id: 6,
    title: "Évaluation des résultats",
    goal: "Vérifier si le projet a réussi et améliorer la suite.",
    icon: BarChart3,
    iconBox: "bg-rose-500 text-white shadow-lg shadow-rose-500/30",
    cardBorder: "border-l-4 border-l-rose-500",
    cardBg: "bg-rose-50/40",
    fieldBg: "bg-white/80 border-rose-100",
    labelColor: "text-rose-700",
    fields: [
      { key: "evaluationMetrics", label: "Mesure d'efficacité" },
      { key: "evaluationComparison", label: "Comparaison avec les objectifs" },
      { key: "evaluationAdjustments", label: "Ajustements" },
    ],
  },
] as const;

export default async function ProjetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getCommunicationProjectById(id);
  if (!result.success || !result.project) notFound();
  const project = result.project;

  const hasAnyContent = SECTIONS.some((section) =>
    section.fields.some((f) => {
      const v = project[f.key as keyof typeof project];
      return v != null && v !== "";
    })
  );

  return (
    <div className="min-h-full bg-gradient-to-br from-indigo-50/60 via-violet-50/40 to-cyan-50/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* Breadcrumb + Back */}
        <nav className="flex items-center gap-2 text-sm">
          <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2 text-violet-600 hover:text-violet-800 hover:bg-violet-100" asChild>
            <Link href="/communication/projets" className="flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Link>
          </Button>
          <ChevronRight className="w-4 h-4 text-violet-300" />
          <Link href="/communication/projets" className="text-violet-600 hover:text-violet-800 transition-colors">
            Projets
          </Link>
          <ChevronRight className="w-4 h-4 text-violet-300" />
          <span className="text-slate-800 font-semibold truncate max-w-[200px] sm:max-w-xs" title={project.name}>
            {project.name}
          </span>
        </nav>

        {/* Hero: project name + meta */}
        <header className="rounded-2xl bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-cyan-500/10 border border-violet-200/60 px-6 py-6 sm:px-8 sm:py-7 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="gap-1.5 font-medium bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0 shadow-md shadow-indigo-500/25">
              <FileText className="w-3.5 h-3.5" />
              Projet de communication
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mt-3">
            {project.name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600 mt-3">
            {project.createdBy ? (
              <span className="inline-flex items-center gap-1.5">
                <User className="w-4 h-4 text-violet-500" />
                Créé par {project.createdBy.firstName} {project.createdBy.lastName}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <User className="w-4 h-4 text-violet-400" />
                —
              </span>
            )}
            <span className="text-violet-300" aria-hidden>·</span>
            <span>
              Mis à jour le {new Date(project.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
        </header>

        <Separator className="bg-gradient-to-r from-transparent via-violet-200 to-transparent h-0.5" />

        {/* Sections */}
        {!hasAnyContent ? (
          <Card className="border-2 border-dashed border-violet-200 bg-white/70 overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 p-5 mb-4 ring-4 ring-white/80 shadow-inner">
                <FileText className="w-12 h-12 text-indigo-500" />
              </div>
              <p className="text-slate-700 font-semibold">Aucun contenu renseigné</p>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                Les différentes étapes du projet de communication pourront être complétées ici.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const values = section.fields.map((f) => {
                const v = project[f.key as keyof typeof project];
                return typeof v === "string" ? v : null;
              }).filter(Boolean);
              if (values.every((v) => !v)) return null;
              return (
                <Card
                  key={section.id}
                  className={`overflow-hidden border-slate-200/80 shadow-md hover:shadow-lg transition-all duration-200 ${section.cardBorder} ${section.cardBg}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${section.iconBox}`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <CardTitle className="text-xl text-slate-900">
                          {section.title}
                        </CardTitle>
                        <CardDescription className="text-slate-600">
                          {section.goal}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-5">
                    {section.fields.map((field) => {
                      const value = project[field.key as keyof typeof project];
                      if (value == null || value === "") return null;
                      return (
                        <div key={field.key} className="group">
                          <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${section.labelColor}`}>
                            {field.label}
                          </p>
                          <div className={`rounded-lg border px-4 py-3 text-slate-800 whitespace-pre-wrap leading-relaxed ${section.fieldBg}`}>
                            {String(value)}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
