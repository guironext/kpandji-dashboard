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
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_COLORS = [
  { gradient: "from-violet-500 to-purple-600" },
  { gradient: "from-amber-500 to-orange-500" },
  { gradient: "from-emerald-500 to-teal-500" },
  { gradient: "from-rose-500 to-pink-500" },
  { gradient: "from-sky-500 to-blue-500" },
  { gradient: "from-cyan-500 to-teal-500" },
] as const;

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
};

export default function ProjetDetailClient({ project, children }: Props) {
  const router = useRouter();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editStep, setEditStep] = useState(1);
  const [form, setForm] = useState<CommunicationProjectInput>(() => toFormData(project));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        router.push("/communication/projets");
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

  const stepColor = STEP_COLORS[editStep - 1];

  return (
    <>
      {/* Hero: project name + meta + action buttons */}
      <header className="rounded-2xl bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-cyan-500/10 border border-violet-200/60 px-6 py-6 sm:px-8 sm:py-7 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="gap-1.5 font-medium bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0 shadow-md shadow-indigo-500/25">
              <FileText className="w-3.5 h-3.5" />
              Projet de communication
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={openEditDialog}
              variant="default"
              size="sm"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md hover:from-violet-700 hover:to-indigo-700"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </Button>
            <Button
              onClick={() => setShowDeleteDialog(true)}
              variant="destructive"
              size="sm"
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          </div>
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

      {children}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Modifier le projet</DialogTitle>
            <DialogDescription>
              Modifiez les informations du projet de communication.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 overflow-x-auto py-2 border-b">
            {STEPS.map((s) => {
              const isActive = editStep === s.id;
              const colors = STEP_COLORS[s.id - 1];
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setEditStep(s.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all",
                    isActive
                      ? `bg-gradient-to-r ${colors.gradient} text-white`
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {s.id}. {s.title}
                </button>
              );
            })}
          </div>
          <div className="flex-1 overflow-y-auto space-y-5 py-4">
            {STEPS.map((s) => {
              if (s.id !== editStep) return null;
              const Icon = s.icon;
              return (
                <div key={s.id} className="space-y-4">
                  <div className={cn("flex items-center gap-2 text-lg font-semibold", s.id === 1 ? "text-violet-700" : "text-slate-700")}>
                    <Icon className="h-5 w-5" />
                    {s.title}
                  </div>
                  {s.fields.map((fieldKey) => (
                    <div key={fieldKey}>
                      <Label className="text-slate-700">{FIELD_LABELS[fieldKey] ?? fieldKey}</Label>
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
                          onChange={(e) => updateForm(fieldKey as keyof CommunicationProjectInput, e.target.value)}
                          className="mt-2 min-h-[80px] resize-y"
                          placeholder={FIELD_LABELS[fieldKey]}
                        />
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <DialogFooter className="border-t pt-4">
            <div className="flex w-full justify-between">
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
                <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
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
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle>Supprimer le projet</DialogTitle>
            </div>
            <div className="text-muted-foreground text-base" id={`delete-desc-${project.id}`}>
              Êtes-vous sûr de vouloir supprimer le projet <strong>{project.name}</strong> ?
              <br />
              <br />
              Cette action est <strong>irréversible</strong> et supprimera également toutes les données associées :
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Tous les plans d&apos;action</li>
                <li>Tous les acteurs du projet</li>
                <li>Tous les éléments de budget</li>
              </ul>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
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
