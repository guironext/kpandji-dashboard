"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type {
  CommunicationProjectDetail,
  CommunicationProjectInput,
} from "@/lib/actions/communication-project";
import { toast } from "sonner";
import {
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Search,
  Target,
  MessageSquare,
  Calendar,
  Play,
  BarChart3,
  AlertTriangle,
  User,
  Sparkles,
  Layers,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PROJECT_STEP_COLORS } from "../project-sections";

const STEPS = [
  { id: 1, title: "Analyse de la situation", icon: Search, fields: ["name", "diagnosticContext", "diagnosticTarget", "diagnosticEnvironment", "diagnosticForces"] as const },
  { id: 2, title: "Définition des objectifs", icon: Target, fields: ["objectives"] as const },
  { id: 3, title: "Définition de la stratégie", icon: MessageSquare, fields: ["strategyPositioning", "strategyTargets", "strategyChannels"] as const },
  { id: 4, title: "Plan d'action", icon: Calendar, fields: ["actionPlan", "actionSupports", "actionCalendar", "actionBudget"] as const },
  { id: 5, title: "Mise en œuvre", icon: Play, fields: ["implementationContent", "implementationLaunch", "implementationTeams"] as const },
  { id: 6, title: "Évaluation des résultats", icon: BarChart3, fields: ["evaluationMetrics", "evaluationComparison", "evaluationAdjustments"] as const },
];

const FIELD_LABELS: Record<string, string> = {
  name: "Nom du projet",
  diagnosticContext: "Contexte, problème ou besoin",
  diagnosticTarget: "Cible (public visé)",
  diagnosticEnvironment: "Environnement (concurrence, marché, image)",
  diagnosticForces: "Forces et faiblesses",
  objectives: "Objectifs clairs et mesurables (SMART)",
  strategyPositioning: "Positionnement et message principal",
  strategyTargets: "Cibles prioritaires",
  strategyChannels: "Canaux",
  actionPlan: "Actions à réaliser",
  actionSupports: "Supports",
  actionCalendar: "Calendrier",
  actionBudget: "Budget et responsabilités",
  implementationContent: "Création des contenus",
  implementationLaunch: "Lancement des campagnes",
  implementationTeams: "Coordination des équipes",
  evaluationMetrics: "Mesure d'efficacité",
  evaluationComparison: "Comparaison avec les objectifs",
  evaluationAdjustments: "Ajustements",
};

function toFormData(project: CommunicationProjectDetail): CommunicationProjectInput {
  return {
    name: project.name,
    diagnosticContext: project.diagnosticContext ?? "",
    diagnosticTarget: project.diagnosticTarget ?? "",
    diagnosticEnvironment: project.diagnosticEnvironment ?? "",
    diagnosticForces: project.diagnosticForces ?? "",
    objectives: project.objectives ?? "",
    strategyPositioning: project.strategyPositioning ?? "",
    strategyTargets: project.strategyTargets ?? "",
    strategyChannels: project.strategyChannels ?? "",
    actionPlan: project.actionPlan ?? "",
    actionSupports: project.actionSupports ?? "",
    actionCalendar: project.actionCalendar ?? "",
    actionBudget: project.actionBudget ?? "",
    implementationContent: project.implementationContent ?? "",
    implementationLaunch: project.implementationLaunch ?? "",
    implementationTeams: project.implementationTeams ?? "",
    evaluationMetrics: project.evaluationMetrics ?? "",
    evaluationComparison: project.evaluationComparison ?? "",
    evaluationAdjustments: project.evaluationAdjustments ?? "",
  };
}

type Props = {
  project: CommunicationProjectDetail;
  children: React.ReactNode;
  projetsListPath?: string;
  hasAnyContent: boolean;
  progressPercent: number;
  filledFields: number;
  totalFields: number;
  sectionsCompleted: number;
};

export default function ProjetDetailClient({
  project,
  children,
  projetsListPath = "/communication/projets",
  hasAnyContent,
  progressPercent,
  filledFields,
  totalFields,
  sectionsCompleted,
}: Props) {
  const router = useRouter();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editStep, setEditStep] = useState(1);
  const [form, setForm] = useState<CommunicationProjectInput>(() => toFormData(project));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isActive = project.projectStatus === "ACTIVE";
  const stepColor = PROJECT_STEP_COLORS[editStep - 1];

  const updateForm = (field: keyof CommunicationProjectInput, value: string | null) => {
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
  };

  const openEditDialog = () => {
    setForm(toFormData(project));
    setEditStep(1);
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Le nom du projet est obligatoire.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/communication/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: project.id, ...form }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        toast.success("Projet mis à jour avec succès.");
        setShowEditDialog(false);
        router.refresh();
      } else {
        toast.error(result?.error ?? "Erreur lors de la mise à jour.");
      }
    } catch (err) {
      console.error("Update project:", err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(
        msg === "Failed to fetch"
          ? "Impossible de contacter le serveur. Vérifiez que l'application tourne."
          : "Erreur lors de la mise à jour du projet."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/communication/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: project.id }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        toast.success(`Le projet "${project.name}" a été supprimé avec succès.`);
        setShowDeleteDialog(false);
        router.push(projetsListPath);
        router.refresh();
      } else {
        toast.error(result?.error ?? "Erreur lors de la suppression.");
      }
    } catch (err) {
      console.error("Delete project:", err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(
        msg === "Failed to fetch"
          ? "Impossible de contacter le serveur. Vérifiez que l'application tourne."
          : "Erreur lors de la suppression du projet."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <header className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/80 shadow-2xl shadow-violet-500/10 backdrop-blur-xl">
        <div
          className="absolute inset-0 bg-gradient-to-br from-violet-600/8 via-transparent to-cyan-500/8"
          aria-hidden
        />
        <div
          className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-400/15 blur-2xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-cyan-400/10 blur-2xl"
          aria-hidden
        />

        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="gap-1.5 border-0 bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1 text-white shadow-md shadow-violet-500/25">
                  <Sparkles className="h-3.5 w-3.5" />
                  Projet de communication
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "border-0 font-medium",
                    isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  {isActive ? "Actif" : "Inactif"}
                </Badge>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
                {project.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                {project.createdBy ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100">
                      <User className="h-3.5 w-3.5 text-violet-600" />
                    </span>
                    {project.createdBy.firstName} {project.createdBy.lastName}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <Clock className="h-4 w-4 text-slate-400" />
                  Mis à jour le{" "}
                  {new Date(project.updatedAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-stretch xl:flex-row">
              <Button
                onClick={openEditDialog}
                size="sm"
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-indigo-700"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Modifier
              </Button>
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Complétion globale
              </p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <span className="text-2xl font-bold text-slate-900">
                  {progressPercent}%
                </span>
                <span className="text-xs text-slate-500">
                  {filledFields}/{totalFields} champs
                </span>
              </div>
              <Progress
                value={progressPercent}
                className="mt-3 h-2 bg-slate-200/80 [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-indigo-500"
              />
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                <Layers className="h-3.5 w-3.5" />
                Étapes
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {sectionsCompleted}
                <span className="text-lg font-normal text-slate-400">
                  {" "}
                  / 6
                </span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                étapes avec du contenu
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Méthodologie
              </p>
              <p className="mt-2 text-sm font-medium leading-snug text-slate-700">
                Diagnostic → Objectifs → Stratégie → Plan → Mise en œuvre →
                Évaluation
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-10">
        {!hasAnyContent ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-violet-200/80 bg-white/60 px-6 py-20 text-center shadow-inner backdrop-blur-sm">
            <div className="relative">
              <div className="absolute inset-0 scale-150 rounded-full bg-gradient-to-br from-violet-400/20 to-cyan-400/20 blur-xl" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-xl shadow-violet-500/30">
                <FileText className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="mt-8 text-xl font-bold text-slate-900">
              Votre projet est prêt à être structuré
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              Complétez les 6 étapes de la méthodologie de communication pour
              documenter votre diagnostic, stratégie et plan d&apos;action.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {PROJECT_STEP_COLORS.map((c, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-2 w-8 rounded-full bg-gradient-to-r opacity-40",
                    c.gradient
                  )}
                />
              ))}
            </div>
            <Button
              onClick={openEditDialog}
              size="lg"
              className="mt-8 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-indigo-700"
            >
              <Pencil className="mr-2 h-5 w-5" />
              Commencer à compléter
            </Button>
          </div>
        ) : (
          children
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden gap-0 p-0">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle>Modifier le projet</DialogTitle>
            <DialogDescription>
              Parcourez les 6 étapes pour mettre à jour votre projet.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-1.5 overflow-x-auto border-b bg-slate-50/80 px-4 py-3">
            {STEPS.map((s) => {
              const isActive = editStep === s.id;
              const colors = PROJECT_STEP_COLORS[s.id - 1];
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setEditStep(s.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all sm:text-sm",
                    isActive
                      ? cn("bg-gradient-to-r text-white shadow-md", colors.gradient)
                      : "bg-white text-slate-600 shadow-sm hover:bg-slate-100"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">{s.id}.</span> {s.title.split(" ").slice(0, 2).join(" ")}…
                </button>
              );
            })}
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {STEPS.map((s) => {
              if (s.id !== editStep) return null;
              const Icon = s.icon;
              const colors = PROJECT_STEP_COLORS[s.id - 1];
              return (
                <div key={s.id} className="space-y-4">
                  <div className={cn("flex items-center gap-3 text-lg font-semibold", colors.accent)}>
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white",
                        colors.gradient
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    {s.title}
                  </div>
                  {s.fields.map((fieldKey) => (
                    <div key={fieldKey}>
                      <Label className="text-slate-700">
                        {FIELD_LABELS[fieldKey] ?? fieldKey}
                      </Label>
                      {fieldKey === "name" ? (
                        <Input
                          value={form.name}
                          onChange={(e) => updateForm("name", e.target.value)}
                          className="mt-2"
                          placeholder="Nom du projet"
                        />
                      ) : (
                        <Textarea
                          value={form[fieldKey as keyof CommunicationProjectInput] ?? ""}
                          onChange={(e) =>
                            updateForm(
                              fieldKey as keyof CommunicationProjectInput,
                              e.target.value
                            )
                          }
                          className="mt-2 min-h-[88px] resize-y"
                          placeholder={FIELD_LABELS[fieldKey]}
                        />
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <DialogFooter className="border-t bg-slate-50/50 px-6 py-4">
            <div className="flex w-full justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditStep((s) => Math.max(1, s - 1))}
                disabled={editStep === 1 || isSaving}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Précédent
              </Button>
              {editStep < 6 ? (
                <Button
                  type="button"
                  onClick={() => setEditStep((s) => Math.min(6, s + 1))}
                  className={cn("bg-gradient-to-r text-white", stepColor.gradient)}
                >
                  Suivant
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  Enregistrer
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent aria-describedby={`delete-desc-${project.id}`}>
          <DialogHeader>
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle>Supprimer le projet</DialogTitle>
            </div>
            <div
              className="text-base text-muted-foreground"
              id={`delete-desc-${project.id}`}
            >
              Êtes-vous sûr de vouloir supprimer le projet{" "}
              <strong>{project.name}</strong> ?
              <br />
              <br />
              Cette action est <strong>irréversible</strong> et supprimera
              également toutes les données associées :
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                <li>Tous les plans d&apos;action</li>
                <li>Tous les acteurs du projet</li>
                <li>Tous les éléments de budget</li>
              </ul>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer définitivement
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
