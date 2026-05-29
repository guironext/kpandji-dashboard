"use client";

import type { ComponentType, ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CommunicationProjectDetail } from "@/lib/actions/communication-project";
import type { PlanActionItem } from "@/lib/actions/communication-plan-action";
import type { CommunicationProjectActor } from "@/lib/actions/communication-actor";
import type { CommunicationBudgetItem } from "@/lib/actions/communication-budget";
import {
  Loader2,
  FileDown,
  Calendar,
  Users,
  DollarSign,
  FileText,
  Target,
  TrendingUp,
  CheckCircle2,
  Clock,
  Building2,
  Briefcase,
  Sparkles,
  ArrowRight,
  Trash2,
  AlertTriangle,
  FolderKanban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ProjectDetailSection,
  StatCard,
  type AccentTheme,
} from "./resume-projet-ui";

type ProjectListItem = {
  id: string;
  name: string;
  projectStatus: "ACTIVE" | "INACTIVE";
};

export type ResumeProjetViewProps = {
  embedded: boolean;
  accent: AccentTheme;
  activeProjects: ProjectListItem[];
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  loading: boolean;
  project: CommunicationProjectDetail | null;
  planActions: PlanActionItem[];
  actors: CommunicationProjectActor[];
  budgetItems: CommunicationBudgetItem[];
  budgetTotal: number;
  exporting: boolean;
  deleting: boolean;
  showDeleteDialog: boolean;
  onShowDeleteDialog: (open: boolean) => void;
  onExport: () => void;
  onDelete: () => void;
  formatDate: (date: Date | string) => string;
  formatDateTime: (date: Date | string) => string;
  formatNumber: (num: number) => string;
};

function SectionCard({
  title,
  icon: Icon,
  count,
  countLabel,
  headerClass,
  iconBoxClass,
  children,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  count?: number;
  countLabel?: string;
  headerClass: string;
  iconBoxClass: string;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-slate-200/80 shadow-md">
      <CardHeader className={cn("border-b border-slate-100", headerClass)}>
        <CardTitle className="flex flex-wrap items-center gap-3 text-lg sm:text-xl">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white",
              iconBoxClass
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <span className="min-w-0 flex-1">{title}</span>
          {count !== undefined && count > 0 && countLabel && (
            <Badge variant="secondary" className="ml-auto shrink-0 font-normal">
              {count} {countLabel}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">{children}</CardContent>
    </Card>
  );
}

function EmptyBlock({
  icon: Icon,
  message,
  iconClass,
}: {
  icon: ComponentType<{ className?: string }>;
  message: string;
  iconClass: string;
}) {
  return (
    <div className="py-10 text-center sm:py-12">
      <div
        className={cn(
          "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl",
          iconClass
        )}
      >
        <Icon className="h-7 w-7" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

export default function ResumeProjetView({
  embedded,
  accent,
  activeProjects,
  selectedProjectId,
  onSelectProject,
  loading,
  project,
  planActions,
  actors,
  budgetItems,
  budgetTotal,
  exporting,
  deleting,
  showDeleteDialog,
  onShowDeleteDialog,
  onExport,
  onDelete,
  formatDate,
  formatDateTime,
  formatNumber,
}: ResumeProjetViewProps) {
  const projectList = (
    <>
      {activeProjects.length === 0 ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
            <FileText className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">Aucun projet actif</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeProjects.map((proj) => (
            <button
              key={proj.id}
              type="button"
              onClick={() => onSelectProject(proj.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                selectedProjectId === proj.id
                  ? accent.chipActive
                  : accent.chipInactive
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  selectedProjectId === proj.id ? "bg-white" : "bg-slate-400"
                )}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-base">
                {proj.name}
              </span>
              {selectedProjectId === proj.id && (
                <ArrowRight className="h-4 w-4 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div
      className={cn(
        embedded ? "" : "min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/80"
      )}
    >
      {!embedded && (
        <header
          className={cn(
            "relative overflow-hidden border-b border-white/10 bg-gradient-to-br text-white",
            accent.hero
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.14),transparent_50%)]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Communication
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Résumé des projets
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
              Vue d&apos;ensemble, export Word et synthèse de chaque projet actif.
            </p>
          </div>
        </header>
      )}

      <div
        className={cn(
          "mx-auto",
          embedded
            ? "max-w-full px-4 py-5 sm:px-6 sm:py-6"
            : "max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        )}
      >
        <div
          className={cn(
            "mb-5 rounded-2xl border bg-white p-4 shadow-sm sm:mb-6 sm:p-5 xl:hidden",
            embedded ? "border-rose-100" : "border-slate-200/80"
          )}
        >
          <Label
            htmlFor="resume-project-select"
            className="text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            Projet actif
          </Label>
          <Select
            value={selectedProjectId ?? ""}
            onValueChange={(v) => onSelectProject(v || null)}
          >
            <SelectTrigger
              id="resume-project-select"
              className={cn(
                "mt-2 h-11 w-full rounded-xl border-slate-200 bg-slate-50/50 sm:h-12",
                accent.ring
              )}
            >
              <FolderKanban className="mr-2 h-5 w-5 shrink-0 text-slate-400" />
              <SelectValue placeholder="Choisir un projet..." />
            </SelectTrigger>
            <SelectContent>
              {activeProjects.map((proj) => (
                <SelectItem key={proj.id} value={proj.id}>
                  {proj.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
          <aside className="hidden shrink-0 xl:block xl:w-72 xl:sticky xl:top-4 xl:self-start">
            <Card className="overflow-hidden border-slate-200/80 shadow-md">
              <CardHeader
                className={cn("bg-gradient-to-r text-white", accent.sidebarHeader)}
              >
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5" />
                  <CardTitle className="text-base text-white">Projets actifs</CardTitle>
                </div>
                <CardDescription className="text-white/80">
                  {activeProjects.length} projet{activeProjects.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[min(70vh,560px)] overflow-y-auto p-3 sm:p-4">
                {projectList}
              </CardContent>
            </Card>
          </aside>

          <main className="min-w-0 flex-1">
            {loading ? (
              <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 py-14">
                <div className="text-center">
                  <Loader2
                    className={cn("mx-auto mb-3 h-9 w-9 animate-spin", accent.loader)}
                  />
                  <p className="text-sm font-medium text-slate-600">Chargement...</p>
                </div>
              </div>
            ) : !project ? (
              <Card className="border-dashed border-slate-200 shadow-sm">
                <CardContent className="py-14 sm:py-16">
                  <div className="text-center">
                    <div
                      className={cn(
                        "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl",
                        accent.statIcon
                      )}
                    >
                      <FileText className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Aucun projet sélectionné
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {activeProjects.length === 0
                        ? "Créez d'abord un projet actif."
                        : "Sélectionnez un projet pour afficher son résumé."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-5 sm:space-y-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  <StatCard
                    label="Actions"
                    value={String(planActions.length)}
                    icon={Calendar}
                    iconClassName="bg-orange-100 text-orange-600"
                  />
                  <StatCard
                    label="Acteurs"
                    value={String(actors.length)}
                    icon={Users}
                    iconClassName="bg-violet-100 text-violet-600"
                  />
                  <StatCard
                    label="Lignes budget"
                    value={String(budgetItems.length)}
                    icon={DollarSign}
                    iconClassName="bg-emerald-100 text-emerald-600"
                  />
                  <StatCard
                    label="Budget total"
                    value={
                      budgetItems.length > 0
                        ? `${formatNumber(budgetTotal)} F`
                        : "—"
                    }
                    icon={TrendingUp}
                    iconClassName={accent.statIcon}
                  />
                </div>

                <Card className="overflow-hidden border-slate-200/80 shadow-md">
                  <CardContent className="p-5 sm:p-6 lg:p-8">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-start gap-3">
                          <div
                            className={cn(
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md sm:h-12 sm:w-12",
                              accent.hero
                            )}
                          >
                            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
                          </div>
                          <div className="min-w-0">
                            <Badge className={cn("mb-2 border", accent.badge)}>
                              Projet actif
                            </Badge>
                            <h2 className="text-xl font-bold leading-tight text-slate-900 sm:text-2xl lg:text-3xl">
                              {project.name}
                            </h2>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:gap-4">
                          <span className="inline-flex items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0" />
                            Créé le {formatDate(project.createdAt)}
                          </span>
                          {project.createdBy && (
                            <span className="inline-flex items-center gap-2">
                              <Users className="h-4 w-4 shrink-0" />
                              {project.createdBy.firstName}{" "}
                              {project.createdBy.lastName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:flex-col">
                        <Button
                          onClick={onExport}
                          disabled={exporting}
                          size="lg"
                          className={cn(
                            "h-11 w-full bg-gradient-to-r text-white shadow-md lg:min-w-[190px]",
                            accent.button,
                            accent.shadow
                          )}
                        >
                          {exporting ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Export...
                            </>
                          ) : (
                            <>
                              <FileDown className="mr-2 h-5 w-5" />
                              Exporter Word
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => onShowDeleteDialog(true)}
                          disabled={deleting}
                          size="lg"
                          variant="outline"
                          className="h-11 w-full border-red-200 text-red-700 hover:bg-red-50 lg:min-w-[190px]"
                        >
                          <Trash2 className="mr-2 h-5 w-5" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Dialog open={showDeleteDialog} onOpenChange={onShowDeleteDialog}>
                  <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                    <DialogHeader>
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-red-100 p-2">
                          <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <DialogTitle>Supprimer le projet</DialogTitle>
                      </div>
                      <DialogDescription className="text-left text-base">
                        Supprimer <strong>{project.name}</strong> ? Cette action est
                        irréversible et efface les plans d&apos;action, acteurs et budget
                        associés.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        onClick={() => onShowDeleteDialog(false)}
                        disabled={deleting}
                        className="w-full sm:w-auto"
                      >
                        Annuler
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={onDelete}
                        disabled={deleting}
                        className="w-full sm:w-auto"
                      >
                        {deleting ? (
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

                <SectionCard
                  title="Détails du projet"
                  icon={FileText}
                  headerClass="bg-gradient-to-r from-slate-50 to-slate-100/80"
                  iconBoxClass="bg-slate-700"
                >
                  <div className="space-y-3">
                    <ProjectDetailSection
                      title="1. Diagnostic"
                      icon={Target}
                      borderClass="border-blue-500"
                      iconClass="bg-blue-600"
                      defaultOpen
                      fields={[
                        { label: "Contexte", value: project.diagnosticContext },
                        { label: "Cible", value: project.diagnosticTarget },
                        { label: "Environnement", value: project.diagnosticEnvironment },
                        { label: "Forces / faiblesses", value: project.diagnosticForces },
                      ]}
                    />
                    <ProjectDetailSection
                      title="2. Objectifs (SMART)"
                      icon={CheckCircle2}
                      borderClass="border-emerald-500"
                      iconClass="bg-emerald-600"
                      fields={[{ label: "Objectifs", value: project.objectives }]}
                    />
                    <ProjectDetailSection
                      title="3. Stratégie"
                      icon={TrendingUp}
                      borderClass="border-violet-500"
                      iconClass="bg-violet-600"
                      fields={[
                        { label: "Positionnement", value: project.strategyPositioning },
                        { label: "Cibles prioritaires", value: project.strategyTargets },
                        { label: "Canaux", value: project.strategyChannels },
                      ]}
                    />
                    <ProjectDetailSection
                      title="4. Plan d'action (cadre)"
                      icon={Calendar}
                      borderClass="border-orange-500"
                      iconClass="bg-orange-600"
                      fields={[
                        { label: "Actions", value: project.actionPlan },
                        { label: "Supports", value: project.actionSupports },
                        { label: "Calendrier", value: project.actionCalendar },
                        { label: "Budget", value: project.actionBudget },
                      ]}
                    />
                    <ProjectDetailSection
                      title="5. Mise en œuvre"
                      icon={Sparkles}
                      borderClass="border-indigo-500"
                      iconClass="bg-indigo-600"
                      fields={[
                        { label: "Création des contenus", value: project.implementationContent },
                        { label: "Lancement", value: project.implementationLaunch },
                        { label: "Coordination des équipes", value: project.implementationTeams },
                      ]}
                    />
                    <ProjectDetailSection
                      title="6. Évaluation"
                      icon={TrendingUp}
                      borderClass="border-teal-500"
                      iconClass="bg-teal-600"
                      fields={[
                        { label: "Mesure d'efficacité", value: project.evaluationMetrics },
                        { label: "Comparaison avec objectifs", value: project.evaluationComparison },
                        { label: "Ajustements", value: project.evaluationAdjustments },
                      ]}
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  title="Plan d'action"
                  icon={Calendar}
                  count={planActions.length}
                  countLabel={planActions.length > 1 ? "actions" : "action"}
                  headerClass="bg-gradient-to-r from-orange-50 to-amber-50/80"
                  iconBoxClass="bg-orange-600"
                >
                  {planActions.length === 0 ? (
                    <EmptyBlock
                      icon={Calendar}
                      message="Aucun plan d'action défini"
                      iconClass="bg-orange-100 text-orange-400"
                    />
                  ) : (
                    <>
                      <div className="space-y-3 lg:hidden">
                        {planActions.map((action) => (
                          <div
                            key={action.id}
                            className="rounded-xl border border-orange-100 bg-orange-50/40 p-4"
                          >
                            <p className="font-semibold text-slate-900">{action.title}</p>
                            <div className="mt-3 space-y-2 text-sm text-slate-600">
                              <p className="flex items-start gap-2">
                                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                                <span>
                                  <span className="font-medium text-slate-700">Début :</span>{" "}
                                  {formatDateTime(action.startDate)}
                                </span>
                              </p>
                              <p className="flex items-start gap-2">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                <span>
                                  <span className="font-medium text-slate-700">Fin :</span>{" "}
                                  {formatDateTime(action.endDate)}
                                </span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="hidden overflow-x-auto lg:block">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-orange-50/80 hover:bg-orange-50/80">
                              <TableHead>Action</TableHead>
                              <TableHead>Date de début</TableHead>
                              <TableHead>Date de fin</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {planActions.map((action) => (
                              <TableRow key={action.id} className="hover:bg-orange-50/40">
                                <TableCell className="font-medium">{action.title}</TableCell>
                                <TableCell>{formatDateTime(action.startDate)}</TableCell>
                                <TableCell>{formatDateTime(action.endDate)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </SectionCard>

                <SectionCard
                  title="Acteurs du projet"
                  icon={Users}
                  count={actors.length}
                  countLabel={actors.length > 1 ? "acteurs" : "acteur"}
                  headerClass="bg-gradient-to-r from-violet-50 to-purple-50/80"
                  iconBoxClass="bg-violet-600"
                >
                  {actors.length === 0 ? (
                    <EmptyBlock
                      icon={Users}
                      message="Aucun acteur défini"
                      iconClass="bg-violet-100 text-violet-400"
                    />
                  ) : (
                    <>
                      <div className="space-y-3 lg:hidden">
                        {actors.map((actor) => (
                          <div
                            key={actor.id}
                            className="flex gap-3 rounded-xl border border-violet-100 bg-violet-50/40 p-4"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-bold text-white">
                              {actor.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">{actor.name}</p>
                              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                                <Building2 className="h-3.5 w-3.5 shrink-0" />
                                {actor.department}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-600">
                                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                                {actor.job}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="hidden overflow-x-auto lg:block">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-violet-50/80 hover:bg-violet-50/80">
                              <TableHead>Nom</TableHead>
                              <TableHead>Département</TableHead>
                              <TableHead>Poste</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {actors.map((actor) => (
                              <TableRow key={actor.id} className="hover:bg-violet-50/40">
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-semibold text-white">
                                      {actor.name.charAt(0).toUpperCase()}
                                    </div>
                                    {actor.name}
                                  </div>
                                </TableCell>
                                <TableCell>{actor.department}</TableCell>
                                <TableCell>{actor.job}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </SectionCard>

                <SectionCard
                  title="Budget du projet"
                  icon={DollarSign}
                  count={budgetItems.length}
                  countLabel={budgetItems.length > 1 ? "lignes" : "ligne"}
                  headerClass="bg-gradient-to-r from-emerald-50 to-green-50/80"
                  iconBoxClass="bg-emerald-600"
                >
                  {budgetItems.length === 0 ? (
                    <EmptyBlock
                      icon={DollarSign}
                      message="Aucun élément de budget défini"
                      iconClass="bg-emerald-100 text-emerald-400"
                    />
                  ) : (
                    <>
                      <div className="space-y-3 lg:hidden">
                        {budgetItems.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4"
                          >
                            <p className="font-semibold text-slate-900">{item.designation}</p>
                            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <dt className="text-slate-500">Prix unit.</dt>
                                <dd className="font-medium text-slate-800">
                                  {formatNumber(item.prixUnitaire)} FCFA
                                </dd>
                              </div>
                              <div>
                                <dt className="text-slate-500">Quantité</dt>
                                <dd className="font-medium text-slate-800">{item.quantite}</dd>
                              </div>
                              <div className="col-span-2 border-t border-emerald-100 pt-2">
                                <dt className="text-slate-500">Montant</dt>
                                <dd className="text-base font-bold text-emerald-700">
                                  {formatNumber(item.montant)} FCFA
                                </dd>
                              </div>
                            </dl>
                          </div>
                        ))}
                        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-100/50 px-4 py-3 text-right">
                          <span className="text-sm font-medium text-slate-600">Total </span>
                          <span className="text-lg font-bold text-emerald-800">
                            {formatNumber(budgetTotal)} FCFA
                          </span>
                        </div>
                      </div>
                      <div className="hidden overflow-x-auto lg:block">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-emerald-50/80 hover:bg-emerald-50/80">
                              <TableHead>Désignation</TableHead>
                              <TableHead className="text-right">Prix unitaire</TableHead>
                              <TableHead className="text-right">Quantité</TableHead>
                              <TableHead className="text-right">Montant</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {budgetItems.map((item) => (
                              <TableRow key={item.id} className="hover:bg-emerald-50/40">
                                <TableCell className="font-medium">{item.designation}</TableCell>
                                <TableCell className="text-right">
                                  {formatNumber(item.prixUnitaire)} FCFA
                                </TableCell>
                                <TableCell className="text-right">{item.quantite}</TableCell>
                                <TableCell className="text-right font-semibold text-emerald-700">
                                  {formatNumber(item.montant)} FCFA
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                          <TableFooter className="bg-emerald-50/80">
                            <TableRow>
                              <TableCell colSpan={3} className="text-right font-bold">
                                TOTAL
                              </TableCell>
                              <TableCell className="text-right font-bold text-emerald-700">
                                {formatNumber(budgetTotal)} FCFA
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        </Table>
                      </div>
                    </>
                  )}
                </SectionCard>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
