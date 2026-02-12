"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type {
  CommunicationProjectInput,
  CommunicationProjectListItem,
} from "@/lib/actions/communication-project";
import { toast } from "sonner";
import {
  Search,
  Target,
  MessageSquare,
  Calendar,
  Play,
  BarChart3,
  Plus,
  ChevronRight,
  ChevronLeft,
  Loader2,
  FileText,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_COLORS = [
  { bg: "bg-violet-500", light: "bg-violet-500/15", ring: "ring-violet-500/30", text: "text-violet-700", gradient: "from-violet-500 to-purple-600" },
  { bg: "bg-amber-500", light: "bg-amber-500/15", ring: "ring-amber-500/30", text: "text-amber-700", gradient: "from-amber-500 to-orange-500" },
  { bg: "bg-emerald-500", light: "bg-emerald-500/15", ring: "ring-emerald-500/30", text: "text-emerald-700", gradient: "from-emerald-500 to-teal-500" },
  { bg: "bg-rose-500", light: "bg-rose-500/15", ring: "ring-rose-500/30", text: "text-rose-700", gradient: "from-rose-500 to-pink-500" },
  { bg: "bg-sky-500", light: "bg-sky-500/15", ring: "ring-sky-500/30", text: "text-sky-700", gradient: "from-sky-500 to-blue-500" },
  { bg: "bg-cyan-500", light: "bg-cyan-500/15", ring: "ring-cyan-500/30", text: "text-cyan-700", gradient: "from-cyan-500 to-teal-500" },
] as const;

const STEPS = [
  { id: 1, title: "Analyse de la situation", subtitle: "Diagnostic", icon: Search, goal: "Savoir pourquoi communiquer et pour qui." },
  { id: 2, title: "Définition des objectifs", subtitle: "Objectifs SMART", icon: Target, goal: "Définir ce qu'on veut atteindre." },
  { id: 3, title: "Définition de la stratégie", subtitle: "Stratégie", icon: MessageSquare, goal: "Décider comment on va communiquer." },
  { id: 4, title: "Plan d'action", subtitle: "Plan de communication", icon: Calendar, goal: "Organiser quoi faire, quand, et avec quels moyens." },
  { id: 5, title: "Mise en œuvre", subtitle: "Réalisation", icon: Play, goal: "Passer à l'action." },
  { id: 6, title: "Évaluation des résultats", subtitle: "Suivi", icon: BarChart3, goal: "Vérifier si le projet a réussi et améliorer la suite." },
];

export default function ProjetsClient({
  initialProjects,
}: {
  initialProjects: CommunicationProjectListItem[];
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<CommunicationProjectInput>({
    name: "",
    diagnosticContext: "",
    diagnosticTarget: "",
    diagnosticEnvironment: "",
    diagnosticForces: "",
    objectives: "",
    strategyPositioning: "",
    strategyTargets: "",
    strategyChannels: "",
    actionPlan: "",
    actionSupports: "",
    actionCalendar: "",
    actionBudget: "",
    implementationContent: "",
    implementationLaunch: "",
    implementationTeams: "",
    evaluationMetrics: "",
    evaluationComparison: "",
    evaluationAdjustments: "",
  });

  const updateForm = (field: keyof CommunicationProjectInput, value: string | null) => {
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
  };

  const handleStartCreate = () => {
    setForm({
      name: "",
      diagnosticContext: "",
      diagnosticTarget: "",
      diagnosticEnvironment: "",
      diagnosticForces: "",
      objectives: "",
      strategyPositioning: "",
      strategyTargets: "",
      strategyChannels: "",
      actionPlan: "",
      actionSupports: "",
      actionCalendar: "",
      actionBudget: "",
      implementationContent: "",
      implementationLaunch: "",
      implementationTeams: "",
      evaluationMetrics: "",
      evaluationComparison: "",
      evaluationAdjustments: "",
    });
    setStep(1);
    setIsCreating(true);
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Le nom du projet est obligatoire.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/communication/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (res.ok && result.success && result.project) {
        const p = result.project;
        setProjects((prev) => [
          {
            id: p.id,
            name: p.name,
            createdAt: typeof p.createdAt === "string" ? new Date(p.createdAt) : p.createdAt,
            updatedAt: typeof p.updatedAt === "string" ? new Date(p.updatedAt) : p.updatedAt,
            createdBy: p.createdBy,
          },
          ...prev,
        ]);
        toast.success("Projet de communication créé avec succès.");
        handleCancelCreate();
        router.refresh();
      } else {
        toast.error(result?.error ?? "Erreur lors de la création.");
      }
    } catch (err) {
      console.error("Création projet:", err);
      const rawMessage = err instanceof Error ? err.message : typeof err === "string" ? err : "";
      const message =
        rawMessage === "Failed to fetch" || rawMessage.includes("fetch")
          ? "Impossible de contacter le serveur. Vérifiez que l'application tourne et réessayez."
          : rawMessage || "Erreur lors de la création du projet.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStep = STEPS.find((s) => s.id === step)!;
  const stepColor = STEP_COLORS[step - 1];
  const progressValue = (step / 6) * 100;

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      {/* Header */}
      <header className="mb-8 md:mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Badge className="bg-violet-500/15 text-violet-700 hover:bg-violet-500/25 border-0 font-medium">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Plan de communication
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
              Projets de communication
            </h1>
            <p className="max-w-xl text-sm text-slate-600 sm:text-base">
              Créez et pilotez vos projets en 6 étapes : diagnostic, objectifs, stratégie, plan d&apos;action, mise en œuvre et évaluation.
            </p>
          </div>
          <Button
            onClick={handleStartCreate}
            size="lg"
            className="shrink-0 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 transition hover:from-violet-700 hover:to-indigo-700 hover:shadow-violet-500/30"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nouveau projet
          </Button>
        </div>
      </header>

      {/* Creation wizard */}
      {isCreating && (
        <Card className="mb-8 md:mb-10 overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/50 backdrop-blur-sm md:rounded-2xl">
          {/* Step progress bar */}
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-4 sm:px-6">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-600">Étape {step} sur 6</span>
              <span className="font-semibold text-slate-500">{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} max={100} className="h-2.5 bg-slate-200" />
            {/* Step pills - scroll on small screens */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
              {STEPS.map((s) => {
                const colors = STEP_COLORS[s.id - 1];
                const isActive = step === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStep(s.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all",
                      isActive
                        ? `bg-gradient-to-r ${colors.gradient} text-white shadow-lg`
                        : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                        isActive ? "bg-white/25" : colors.light + " " + colors.text
                      )}
                    >
                      {s.id}
                    </span>
                    <span className="hidden max-w-[140px] truncate sm:inline md:max-w-none">{s.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step content header */}
          <CardHeader className="border-b border-slate-100 bg-white px-4 pb-6 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
              <div
                className={cn(
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                  stepColor.gradient
                )}
              >
                <currentStep.icon className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xl text-slate-900 sm:text-2xl">
                  {currentStep.title}
                </CardTitle>
                <Badge variant="secondary" className={cn("mt-2", stepColor.light, stepColor.text)}>
                  {currentStep.subtitle}
                </Badge>
                <CardDescription className="mt-2 text-slate-600">
                  {currentStep.goal}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 bg-white px-4 py-6 sm:px-6 sm:py-8">
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <Label htmlFor="name" className="text-slate-700">Nom du projet <span className="text-rose-500">*</span></Label>
                  <Input id="name" value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder="Ex. Campagne lancement produit X" className="mt-2 border-slate-200 focus:ring-2 focus:ring-violet-500/30" />
                </div>
                <div>
                  <Label className="text-slate-700">Contexte, problème ou besoin</Label>
                  <Textarea value={form.diagnosticContext ?? ""} onChange={(e) => updateForm("diagnosticContext", e.target.value)} placeholder="Décrivez le contexte, le problème ou le besoin..." className="mt-2 min-h-[100px] resize-y border-slate-200 focus:ring-2 focus:ring-violet-500/30" />
                </div>
                <div>
                  <Label className="text-slate-700">Cible (public visé)</Label>
                  <Textarea value={form.diagnosticTarget ?? ""} onChange={(e) => updateForm("diagnosticTarget", e.target.value)} placeholder="Qui est le public visé ?" className="mt-2 min-h-[80px] resize-y border-slate-200 focus:ring-2 focus:ring-violet-500/30" />
                </div>
                <div>
                  <Label className="text-slate-700">Environnement (concurrence, marché, image)</Label>
                  <Textarea value={form.diagnosticEnvironment ?? ""} onChange={(e) => updateForm("diagnosticEnvironment", e.target.value)} placeholder="Concurrence, marché, image actuelle..." className="mt-2 min-h-[80px] resize-y border-slate-200 focus:ring-2 focus:ring-violet-500/30" />
                </div>
                <div>
                  <Label className="text-slate-700">Forces et faiblesses</Label>
                  <Textarea value={form.diagnosticForces ?? ""} onChange={(e) => updateForm("diagnosticForces", e.target.value)} placeholder="Points forts et points faibles..." className="mt-2 min-h-[80px] resize-y border-slate-200 focus:ring-2 focus:ring-violet-500/30" />
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <Label className="text-slate-700">Objectifs clairs et mesurables (SMART)</Label>
                  <Textarea value={form.objectives ?? ""} onChange={(e) => updateForm("objectives", e.target.value)} placeholder="Ex. Faire connaître la marque, augmenter les ventes de X%..." className="mt-2 min-h-[140px] resize-y border-slate-200 focus:ring-2 focus:ring-amber-500/30" />
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <Label className="text-slate-700">Positionnement et message principal</Label>
                  <Textarea value={form.strategyPositioning ?? ""} onChange={(e) => updateForm("strategyPositioning", e.target.value)} placeholder="Comment vous positionnez-vous ?" className="mt-2 min-h-[80px] resize-y border-slate-200 focus:ring-2 focus:ring-emerald-500/30" />
                </div>
                <div>
                  <Label className="text-slate-700">Cibles prioritaires</Label>
                  <Textarea value={form.strategyTargets ?? ""} onChange={(e) => updateForm("strategyTargets", e.target.value)} placeholder="Quelles cibles en priorité ?" className="mt-2 min-h-[80px] resize-y border-slate-200 focus:ring-2 focus:ring-emerald-500/30" />
                </div>
                <div>
                  <Label className="text-slate-700">Canaux (réseaux sociaux, affichage, web…)</Label>
                  <Textarea value={form.strategyChannels ?? ""} onChange={(e) => updateForm("strategyChannels", e.target.value)} placeholder="Liste des canaux choisis..." className="mt-2 min-h-[80px] resize-y border-slate-200 focus:ring-2 focus:ring-emerald-500/30" />
                </div>
              </div>
            )}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <Label className="text-slate-700">Actions à réaliser</Label>
                  <Textarea value={form.actionPlan ?? ""} onChange={(e) => updateForm("actionPlan", e.target.value)} placeholder="Détail des actions..." className="mt-2 min-h-[80px] resize-y border-slate-200 focus:ring-2 focus:ring-rose-500/30" />
                </div>
                <div>
                  <Label className="text-slate-700">Supports (affiches, vidéos, posts…)</Label>
                  <Textarea value={form.actionSupports ?? ""} onChange={(e) => updateForm("actionSupports", e.target.value)} placeholder="Quels supports ?" className="mt-2 min-h-[80px] resize-y border-slate-200 focus:ring-2 focus:ring-rose-500/30" />
                </div>
                <div>
                  <Label className="text-slate-700">Calendrier</Label>
                  <Textarea value={form.actionCalendar ?? ""} onChange={(e) => updateForm("actionCalendar", e.target.value)} placeholder="Planning (dates, jalons)..." className="mt-2 min-h-[80px] resize-y border-slate-200 focus:ring-2 focus:ring-rose-500/30" />
                </div>
                <div>
                  <Label className="text-slate-700">Budget et responsabilités</Label>
                  <Textarea value={form.actionBudget ?? ""} onChange={(e) => updateForm("actionBudget", e.target.value)} placeholder="Budget, répartition, qui fait quoi..." className="mt-2 min-h-[80px] resize-y border-slate-200 focus:ring-2 focus:ring-rose-500/30" />
                </div>
              </div>
            )}
            {step === 5 && (
              <div className="space-y-5">
                <div>
                  <Label className="text-slate-700">Création des contenus</Label>
                  <Textarea value={form.implementationContent ?? ""} onChange={(e) => updateForm("implementationContent", e.target.value)} placeholder="Contenus à créer (rédaction, visuels...)..." className="mt-2 min-h-[80px] resize-y border-slate-200 focus:ring-2 focus:ring-sky-500/30" />
                </div>
                <div>
                  <Label className="text-slate-700">Lancement des campagnes</Label>
                  <Textarea value={form.implementationLaunch ?? ""} onChange={(e) => updateForm("implementationLaunch", e.target.value)} placeholder="Comment et quand les campagnes sont lancées..." className="mt-2 min-h-[80px] resize-y border-slate-200 focus:ring-2 focus:ring-sky-500/30" />
                </div>
                <div>
                  <Label className="text-slate-700">Coordination des équipes</Label>
                  <Textarea value={form.implementationTeams ?? ""} onChange={(e) => updateForm("implementationTeams", e.target.value)} placeholder="Rôles, coordination..." className="mt-2 min-h-[80px] resize-y border-slate-200 focus:ring-2 focus:ring-sky-500/30" />
                </div>
              </div>
            )}
            {step === 6 && (
              <div className="space-y-5">
                <div>
                  <Label className="text-slate-700">Mesure d&apos;efficacité (statistiques, retours, ventes…)</Label>
                  <Textarea value={form.evaluationMetrics ?? ""} onChange={(e) => updateForm("evaluationMetrics", e.target.value)} placeholder="Quels indicateurs ?" className="mt-2 min-h-[80px] resize-y border-slate-200 focus:ring-2 focus:ring-cyan-500/30" />
                </div>
                <div>
                  <Label className="text-slate-700">Comparaison avec les objectifs</Label>
                  <Textarea value={form.evaluationComparison ?? ""} onChange={(e) => updateForm("evaluationComparison", e.target.value)} placeholder="Comment comparer aux objectifs ?" className="mt-2 min-h-[80px] resize-y border-slate-200 focus:ring-2 focus:ring-cyan-500/30" />
                </div>
                <div>
                  <Label className="text-slate-700">Ajustements et améliorations</Label>
                  <Textarea value={form.evaluationAdjustments ?? ""} onChange={(e) => updateForm("evaluationAdjustments", e.target.value)} placeholder="Processus d'ajustement..." className="mt-2 min-h-[80px] resize-y border-slate-200 focus:ring-2 focus:ring-cyan-500/30" />
                </div>
              </div>
            )}

            {/* Wizard footer */}
            <div className="flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between sm:pt-8">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={handleCancelCreate} disabled={isSubmitting} className="border-slate-200">
                  Annuler
                </Button>
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} disabled={isSubmitting} className="border-slate-200">
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Précédent
                  </Button>
                )}
              </div>
              <div className="flex gap-2 sm:shrink-0">
                {step < 6 ? (
                  <Button
                    type="button"
                    onClick={() => setStep((s) => s + 1)}
                    className={cn("w-full sm:w-auto bg-gradient-to-r text-white shadow-lg", stepColor.gradient, `hover:opacity-95`)}
                  >
                    Suivant
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-700 hover:to-teal-700 sm:w-auto"
                  >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                    Créer le projet
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects list */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Projets existants</h2>
          {projects.length > 0 && (
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-normal">
              {projects.length} projet{projects.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {projects.length === 0 ? (
          <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center px-4 py-12 text-center sm:py-16 md:px-8">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-400/20 via-amber-400/20 to-cyan-400/20">
                <FileText className="h-12 w-12 text-violet-500" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">Aucun projet pour le moment</h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                Créez votre premier projet en suivant les 6 étapes : diagnostic, objectifs, stratégie, plan d&apos;action, mise en œuvre et évaluation.
              </p>
              <Button
                onClick={handleStartCreate}
                size="lg"
                className="mt-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-indigo-700"
              >
                <Plus className="mr-2 h-5 w-5" />
                Nouveau projet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-1">
            {projects.map((p, index) => {
              const accent = STEP_COLORS[index % STEP_COLORS.length];
              return (
                <li key={p.id}>
                  <Link href={`/communication/projets/${p.id}`}>
                    <Card className="group overflow-hidden border-0 bg-white/90 shadow-md shadow-slate-200/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/50 backdrop-blur-sm">
                      <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-5">
                        <div className="flex items-start gap-4">
                          <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md", `bg-gradient-to-br ${accent.gradient}`)}>
                            <FileText className="h-6 w-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900 transition-colors group-hover:text-violet-600">
                              {p.name}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {p.createdBy ? `Créé par ${p.createdBy.firstName} ${p.createdBy.lastName}` : "—"} · Mis à jour le{" "}
                              {new Date(p.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 transition-all group-hover:gap-2.5 sm:shrink-0">
                          Voir le projet 
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
