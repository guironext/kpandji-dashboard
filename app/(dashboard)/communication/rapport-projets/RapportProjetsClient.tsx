"use client";

import { useEffect, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  getCommunicationProjectById,
  setProjectStatusInactive,
  type CommunicationProjectDetail,
} from "@/lib/actions/communication-project";
import {
  getPlanActionsByProjectId,
  type PlanActionItem,
} from "@/lib/actions/communication-plan-action";
import {
  getActorsByProject,
  type CommunicationProjectActor,
} from "@/lib/actions/communication-actor";
import {
  getBudgetItemsByProjectId,
  type CommunicationBudgetItem,
} from "@/lib/actions/communication-budget";
import { toast } from "sonner";
import {
  Loader2,
  FileText,
  Calendar,
  Users,
  DollarSign,
  Target,
  CheckCircle2,
  Clock,
  Building2,
  Briefcase,
  Sparkles,
  ArrowRight,
  Archive,
  TrendingUp,
  FileDown,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table as DocxTable,
  TableRow as DocxTableRow,
  TableCell as DocxTableCell,
  AlignmentType,
  HeadingLevel,
} from "docx";
import { saveAs } from "file-saver";

export type CommunicationProjectListItem = {
  id: string;
  name: string;
  projectStatus: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
  createdBy: { firstName: string; lastName: string } | null;
};

type Props = {
  projects: CommunicationProjectListItem[];
};

export default function RapportProjetsClient({ projects }: Props) {
  const router = useRouter();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects[0]?.id ?? null
  );
  const [project, setProject] = useState<CommunicationProjectDetail | null>(null);
  const [planActions, setPlanActions] = useState<PlanActionItem[]>([]);
  const [actors, setActors] = useState<CommunicationProjectActor[]>([]);
  const [budgetItems, setBudgetItems] = useState<CommunicationBudgetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [classing, setClassing] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!selectedProjectId) {
      setProject(null);
      setPlanActions([]);
      setActors([]);
      setBudgetItems([]);
      return;
    }

    setLoading(true);
    Promise.all([
      getCommunicationProjectById(selectedProjectId),
      getPlanActionsByProjectId(selectedProjectId),
      getActorsByProject(selectedProjectId),
      getBudgetItemsByProjectId(selectedProjectId),
    ])
      .then(([projectRes, planActionsRes, actorsRes, budgetRes]) => {
        if (projectRes.success && projectRes.project) {
          setProject(projectRes.project);
        }
        if (planActionsRes.success) {
          setPlanActions(planActionsRes.actions);
        }
        if (actorsRes.success) {
          setActors(actorsRes.actors);
        }
        if (budgetRes.success) {
          setBudgetItems(budgetRes.items);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading project data:", error);
        toast.error("Erreur lors du chargement des données du projet");
        setLoading(false);
      });
  }, [selectedProjectId]);

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return format(dateObj, "dd MMMM yyyy", { locale: fr });
    } catch {
      return String(date);
    }
  };

  const formatDateTime = (date: Date | string) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return format(dateObj, "dd MMMM yyyy 'à' HH:mm", { locale: fr });
    } catch {
      return String(date);
    }
  };

  const formatNumber = (num: number): string => {
    return Math.round(num).toLocaleString("fr-FR");
  };

  const exportToWord = async () => {
    if (!project) {
      toast.error("Aucun projet sélectionné");
      return;
    }

    setExporting(true);
    try {
      const safePlanActions = Array.isArray(planActions) ? planActions : [];
      const safeActors = Array.isArray(actors) ? actors : [];
      const safeBudgetItems = Array.isArray(budgetItems) ? budgetItems : [];
      const completedActions = safePlanActions.filter((a) => a.completed);

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: project.name,
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),
              new Paragraph({
                text: `Rapport du projet - ${formatDate(new Date())}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Statut: ${project.projectStatus === "ACTIVE" ? "Actif" : "Inactif"}`,
                    bold: true,
                  }),
                ],
                spacing: { after: 100 },
              }),
              ...(project.createdBy
                ? [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "Créé par: ", bold: true }),
                        new TextRun({
                          text: `${project.createdBy.firstName} ${project.createdBy.lastName}`,
                        }),
                      ],
                      spacing: { after: 400 },
                    }),
                  ]
                : []),

              new Paragraph({
                text: "Détails du Projet",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
              }),

              ...(project.diagnosticContext || project.diagnosticTarget || project.diagnosticEnvironment || project.diagnosticForces
                ? [
                    new Paragraph({
                      text: "1. Analyse de la situation (diagnostic)",
                      heading: HeadingLevel.HEADING_2,
                      spacing: { before: 300, after: 100 },
                    }),
                    ...(project.diagnosticContext
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Contexte: ", bold: true }),
                              new TextRun({ text: project.diagnosticContext }),
                            ],
                            spacing: { after: 100 },
                          }),
                        ]
                      : []),
                    ...(project.diagnosticTarget
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Cible: ", bold: true }),
                              new TextRun({ text: project.diagnosticTarget }),
                            ],
                            spacing: { after: 100 },
                          }),
                        ]
                      : []),
                    ...(project.diagnosticEnvironment
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Environnement: ", bold: true }),
                              new TextRun({ text: project.diagnosticEnvironment }),
                            ],
                            spacing: { after: 100 },
                          }),
                        ]
                      : []),
                    ...(project.diagnosticForces
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Forces/Faiblesses: ", bold: true }),
                              new TextRun({ text: project.diagnosticForces }),
                            ],
                            spacing: { after: 200 },
                          }),
                        ]
                      : []),
                  ]
                : []),

              ...(project.objectives
                ? [
                    new Paragraph({
                      text: "2. Définition des objectifs (SMART)",
                      heading: HeadingLevel.HEADING_2,
                      spacing: { before: 300, after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({ text: "Objectifs: ", bold: true }),
                        new TextRun({ text: project.objectives }),
                      ],
                      spacing: { after: 200 },
                    }),
                  ]
                : []),

              ...(project.strategyPositioning || project.strategyTargets || project.strategyChannels
                ? [
                    new Paragraph({
                      text: "3. Stratégie",
                      heading: HeadingLevel.HEADING_2,
                      spacing: { before: 300, after: 100 },
                    }),
                    ...(project.strategyPositioning
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Positionnement: ", bold: true }),
                              new TextRun({ text: project.strategyPositioning }),
                            ],
                            spacing: { after: 100 },
                          }),
                        ]
                      : []),
                    ...(project.strategyTargets
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Cibles prioritaires: ", bold: true }),
                              new TextRun({ text: project.strategyTargets }),
                            ],
                            spacing: { after: 100 },
                          }),
                        ]
                      : []),
                    ...(project.strategyChannels
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Canaux: ", bold: true }),
                              new TextRun({ text: project.strategyChannels }),
                            ],
                            spacing: { after: 200 },
                          }),
                        ]
                      : []),
                  ]
                : []),

              ...(project.actionPlan || project.actionSupports || project.actionCalendar || project.actionBudget
                ? [
                    new Paragraph({
                      text: "4. Plan d'action",
                      heading: HeadingLevel.HEADING_2,
                      spacing: { before: 300, after: 100 },
                    }),
                    ...(project.actionPlan
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Actions: ", bold: true }),
                              new TextRun({ text: project.actionPlan }),
                            ],
                            spacing: { after: 100 },
                          }),
                        ]
                      : []),
                    ...(project.actionSupports
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Supports: ", bold: true }),
                              new TextRun({ text: project.actionSupports }),
                            ],
                            spacing: { after: 100 },
                          }),
                        ]
                      : []),
                    ...(project.actionCalendar
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Calendrier: ", bold: true }),
                              new TextRun({ text: project.actionCalendar }),
                            ],
                            spacing: { after: 100 },
                          }),
                        ]
                      : []),
                    ...(project.actionBudget
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Budget: ", bold: true }),
                              new TextRun({ text: project.actionBudget }),
                            ],
                            spacing: { after: 200 },
                          }),
                        ]
                      : []),
                  ]
                : []),

              ...(project.implementationContent || project.implementationLaunch || project.implementationTeams
                ? [
                    new Paragraph({
                      text: "5. Mise en œuvre",
                      heading: HeadingLevel.HEADING_2,
                      spacing: { before: 300, after: 100 },
                    }),
                    ...(project.implementationContent
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Création des contenus: ", bold: true }),
                              new TextRun({ text: project.implementationContent }),
                            ],
                            spacing: { after: 100 },
                          }),
                        ]
                      : []),
                    ...(project.implementationLaunch
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Lancement: ", bold: true }),
                              new TextRun({ text: project.implementationLaunch }),
                            ],
                            spacing: { after: 100 },
                          }),
                        ]
                      : []),
                    ...(project.implementationTeams
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Coordination des équipes: ", bold: true }),
                              new TextRun({ text: project.implementationTeams }),
                            ],
                            spacing: { after: 200 },
                          }),
                        ]
                      : []),
                  ]
                : []),

              ...(project.evaluationMetrics || project.evaluationComparison || project.evaluationAdjustments
                ? [
                    new Paragraph({
                      text: "6. Évaluation",
                      heading: HeadingLevel.HEADING_2,
                      spacing: { before: 300, after: 100 },
                    }),
                    ...(project.evaluationMetrics
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Mesure d'efficacité: ", bold: true }),
                              new TextRun({ text: project.evaluationMetrics }),
                            ],
                            spacing: { after: 100 },
                          }),
                        ]
                      : []),
                    ...(project.evaluationComparison
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Comparaison avec objectifs: ", bold: true }),
                              new TextRun({ text: project.evaluationComparison }),
                            ],
                            spacing: { after: 100 },
                          }),
                        ]
                      : []),
                    ...(project.evaluationAdjustments
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Ajustements: ", bold: true }),
                              new TextRun({ text: project.evaluationAdjustments }),
                            ],
                            spacing: { after: 200 },
                          }),
                        ]
                      : []),
                  ]
                : []),

              new Paragraph({
                text: "Plan d'Action",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 600, after: 200 },
              }),
              ...(safePlanActions.length > 0
                ? [
                    new DocxTable({
                      columnWidths: [3000, 2000, 2000],
                      rows: [
                        new DocxTableRow({
                          children: [
                            new DocxTableCell({
                              children: [new Paragraph({ text: "Action", heading: HeadingLevel.HEADING_3 })],
                            }),
                            new DocxTableCell({
                              children: [new Paragraph({ text: "Date de début" })],
                            }),
                            new DocxTableCell({
                              children: [new Paragraph({ text: "Date de fin" })],
                            }),
                          ],
                        }),
                        ...safePlanActions.map((action) =>
                          new DocxTableRow({
                            children: [
                              new DocxTableCell({
                                children: [new Paragraph({ text: action.title })],
                              }),
                              new DocxTableCell({
                                children: [new Paragraph({ text: formatDateTime(action.startDate) })],
                              }),
                              new DocxTableCell({
                                children: [new Paragraph({ text: formatDateTime(action.endDate) })],
                              }),
                            ],
                          })
                        ),
                      ],
                    }),
                  ]
                : [
                    new Paragraph({
                      children: [new TextRun({ text: "Aucun plan d'action défini", italics: true })],
                      spacing: { after: 200 },
                    }),
                  ]),

              new Paragraph({
                text: "Acteurs du Projet",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 600, after: 200 },
              }),
              ...(safeActors.length > 0
                ? [
                    new DocxTable({
                      columnWidths: [2500, 2000, 2500],
                      rows: [
                        new DocxTableRow({
                          children: [
                            new DocxTableCell({
                              children: [new Paragraph({ text: "Nom", heading: HeadingLevel.HEADING_3 })],
                            }),
                            new DocxTableCell({
                              children: [new Paragraph({ text: "Département" })],
                            }),
                            new DocxTableCell({
                              children: [new Paragraph({ text: "Poste" })],
                            }),
                          ],
                        }),
                        ...safeActors.map((actor) =>
                          new DocxTableRow({
                            children: [
                              new DocxTableCell({
                                children: [new Paragraph({ text: actor.name })],
                              }),
                              new DocxTableCell({
                                children: [new Paragraph({ text: actor.department })],
                              }),
                              new DocxTableCell({
                                children: [new Paragraph({ text: actor.job })],
                              }),
                            ],
                          })
                        ),
                      ],
                    }),
                  ]
                : [
                    new Paragraph({
                      children: [new TextRun({ text: "Aucun acteur défini", italics: true })],
                      spacing: { after: 200 },
                    }),
                  ]),

              new Paragraph({
                text: "Budget du Projet",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 600, after: 200 },
              }),
              ...(safeBudgetItems.length > 0
                ? [
                    new DocxTable({
                      columnWidths: [3000, 1500, 1500, 2000],
                      rows: [
                        new DocxTableRow({
                          children: [
                            new DocxTableCell({
                              children: [new Paragraph({ text: "Désignation", heading: HeadingLevel.HEADING_3 })],
                            }),
                            new DocxTableCell({
                              children: [new Paragraph({ text: "Prix unitaire" })],
                            }),
                            new DocxTableCell({
                              children: [new Paragraph({ text: "Quantité" })],
                            }),
                            new DocxTableCell({
                              children: [new Paragraph({ text: "Montant" })],
                            }),
                          ],
                        }),
                        ...safeBudgetItems.map((item) =>
                          new DocxTableRow({
                            children: [
                              new DocxTableCell({
                                children: [new Paragraph({ text: item.designation })],
                              }),
                              new DocxTableCell({
                                children: [new Paragraph({ text: formatNumber(item.prixUnitaire) + " FCFA" })],
                              }),
                              new DocxTableCell({
                                children: [new Paragraph({ text: String(item.quantite) })],
                              }),
                              new DocxTableCell({
                                children: [new Paragraph({ text: formatNumber(item.montant) + " FCFA" })],
                              }),
                            ],
                          })
                        ),
                        new DocxTableRow({
                          children: [
                            new DocxTableCell({
                              children: [new Paragraph({ children: [new TextRun({ text: "TOTAL", bold: true })] })],
                            }),
                            new DocxTableCell({ children: [new Paragraph({ text: "" })] }),
                            new DocxTableCell({ children: [new Paragraph({ text: "" })] }),
                            new DocxTableCell({
                              children: [
                                new Paragraph({
                                  children: [
                                    new TextRun({
                                      text:
                                        formatNumber(safeBudgetItems.reduce((sum, item) => sum + item.montant, 0)) +
                                        " FCFA",
                                      bold: true,
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ]
                : [
                    new Paragraph({
                      children: [new TextRun({ text: "Aucun élément de budget défini", italics: true })],
                    }),
                  ]),

              new Paragraph({
                text: "Actions réalisées",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 600, after: 200 },
              }),
              ...(completedActions.length > 0
                ? [
                    new DocxTable({
                      columnWidths: [3000, 2000, 2000, 1500],
                      rows: [
                        new DocxTableRow({
                          children: [
                            new DocxTableCell({
                              children: [new Paragraph({ text: "Action", heading: HeadingLevel.HEADING_3 })],
                            }),
                            new DocxTableCell({
                              children: [new Paragraph({ text: "Date de début" })],
                            }),
                            new DocxTableCell({
                              children: [new Paragraph({ text: "Date de fin" })],
                            }),
                            new DocxTableCell({
                              children: [new Paragraph({ text: "Statut" })],
                            }),
                          ],
                        }),
                        ...completedActions.map((action) =>
                          new DocxTableRow({
                            children: [
                              new DocxTableCell({
                                children: [new Paragraph({ text: action.title })],
                              }),
                              new DocxTableCell({
                                children: [new Paragraph({ text: formatDateTime(action.startDate) })],
                              }),
                              new DocxTableCell({
                                children: [new Paragraph({ text: formatDateTime(action.endDate) })],
                              }),
                              new DocxTableCell({
                                children: [new Paragraph({ text: "Réalisée" })],
                              }),
                            ],
                          })
                        ),
                      ],
                    }),
                  ]
                : [
                    new Paragraph({
                      children: [new TextRun({ text: "Aucune action cochée pour ce projet", italics: true })],
                    }),
                  ]),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const fileName = `Rapport_Projet_${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.docx`;
      saveAs(blob, fileName);
      toast.success("Document Word exporté avec succès");
    } catch (error) {
      console.error("Error exporting to Word:", error);
      toast.error("Erreur lors de l'exportation du document Word");
    } finally {
      setExporting(false);
    }
  };

  const handleClasserProjet = async () => {
    if (!selectedProjectId || !project) return;
    if (project.projectStatus !== "ACTIVE") {
      toast.info("Ce projet est déjà classé (inactif).");
      return;
    }

    setClassing(true);
    try {
      const result = await setProjectStatusInactive(selectedProjectId);
      if (result.success) {
        toast.success(`Le projet "${project.name}" a été classé (inactif).`);
        setProject((prev) => (prev ? { ...prev, projectStatus: "INACTIVE" } : null));
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors du classement du projet");
      }
    } catch (error) {
      console.error("Error classing project:", error);
      toast.error("Erreur lors du classement du projet");
    } finally {
      setClassing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="flex h-screen gap-6 p-6">
        {/* Left Sidebar - All projects (newest first) */}
        <div className="w-80 flex-shrink-0">
          <Card className="h-full shadow-lg border-2">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle className="text-white">Rapport des Projets</CardTitle>
              </div>
              <CardDescription className="text-blue-100">
                {projects.length} projet{projects.length > 1 ? "s" : ""} (du plus récent au plus ancien)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {projects.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                      <FileText className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Aucun projet
                    </p>
                  </div>
                ) : (
                  projects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => setSelectedProjectId(proj.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.02] ${
                        selectedProjectId === proj.id
                          ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600 shadow-lg shadow-blue-500/50"
                          : "bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex-shrink-0 w-2 h-2 rounded-full ${
                            selectedProjectId === proj.id ? "bg-white" : "bg-blue-600"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            className={`font-semibold truncate ${
                              selectedProjectId === proj.id ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {proj.name}
                          </div>
                          <Badge
                            variant={proj.projectStatus === "ACTIVE" ? "default" : "secondary"}
                            className={`mt-1 text-xs ${
                              selectedProjectId === proj.id
                                ? "bg-white/20 text-white border-white/40"
                                : ""
                            }`}
                          >
                            {proj.projectStatus === "ACTIVE" ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                        {selectedProjectId === proj.id && (
                          <ArrowRight className="h-4 w-4 text-white flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Project Details */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium">Chargement des données...</p>
                </div>
              </div>
            ) : !project ? (
              <Card className="shadow-lg border-2">
                <CardContent className="py-16">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 mb-6">
                      <FileText className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      Aucun projet sélectionné
                    </h3>
                    <p className="text-muted-foreground">
                      Sélectionnez un projet dans la liste pour voir le rapport
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6 pb-6">
                {/* Header */}
                <Card className="shadow-lg border-2 bg-gradient-to-r from-white to-blue-50/50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg">
                            <Sparkles className="h-5 w-5 text-white" />
                          </div>
                          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                            {project.name}
                          </h1>
                          <Badge
                            variant={project.projectStatus === "ACTIVE" ? "default" : "secondary"}
                          >
                            {project.projectStatus === "ACTIVE" ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Créé le {formatDate(project.createdAt)}</span>
                          </div>
                          {project.createdBy && (
                            <>
                              <Separator orientation="vertical" className="h-4" />
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>
                                  {project.createdBy.firstName} {project.createdBy.lastName}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Project Details */}
                <Card className="shadow-lg border-2">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-b-2">
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      Détails du Projet
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    {project.diagnosticContext && (
                      <div className="relative pl-6 border-l-4 border-blue-500">
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="h-5 w-5 text-blue-600" />
                          <h3 className="text-lg font-bold text-slate-900">
                            1. Analyse de la situation (diagnostic)
                          </h3>
                        </div>
                        <div className="space-y-3 ml-7">
                          {project.diagnosticContext && (
                            <div className="bg-slate-50 p-4 rounded-lg">
                              <span className="font-semibold text-slate-700">Contexte: </span>
                              <span className="text-slate-600">{project.diagnosticContext}</span>
                            </div>
                          )}
                          {project.diagnosticTarget && (
                            <div className="bg-slate-50 p-4 rounded-lg">
                              <span className="font-semibold text-slate-700">Cible: </span>
                              <span className="text-slate-600">{project.diagnosticTarget}</span>
                            </div>
                          )}
                          {project.diagnosticEnvironment && (
                            <div className="bg-slate-50 p-4 rounded-lg">
                              <span className="font-semibold text-slate-700">Environnement: </span>
                              <span className="text-slate-600">
                                {project.diagnosticEnvironment}
                              </span>
                            </div>
                          )}
                          {project.diagnosticForces && (
                            <div className="bg-slate-50 p-4 rounded-lg">
                              <span className="font-semibold text-slate-700">
                                Forces/Faiblesses:{" "}
                              </span>
                              <span className="text-slate-600">{project.diagnosticForces}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {project.objectives && (
                      <div className="relative pl-6 border-l-4 border-green-500">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <h3 className="text-lg font-bold text-slate-900">
                            2. Définition des objectifs (SMART)
                          </h3>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg ml-7">
                          <span className="font-semibold text-slate-700">Objectifs: </span>
                          <span className="text-slate-600">{project.objectives}</span>
                        </div>
                      </div>
                    )}

                    {(project.strategyPositioning ||
                      project.strategyTargets ||
                      project.strategyChannels) && (
                      <div className="relative pl-6 border-l-4 border-purple-500">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="h-5 w-5 text-purple-600" />
                          <h3 className="text-lg font-bold text-slate-900">3. Stratégie</h3>
                        </div>
                        <div className="space-y-3 ml-7">
                          {project.strategyPositioning && (
                            <div className="bg-purple-50 p-4 rounded-lg">
                              <span className="font-semibold text-slate-700">
                                Positionnement:{" "}
                              </span>
                              <span className="text-slate-600">
                                {project.strategyPositioning}
                              </span>
                            </div>
                          )}
                          {project.strategyTargets && (
                            <div className="bg-purple-50 p-4 rounded-lg">
                              <span className="font-semibold text-slate-700">
                                Cibles prioritaires:{" "}
                              </span>
                              <span className="text-slate-600">{project.strategyTargets}</span>
                            </div>
                          )}
                          {project.strategyChannels && (
                            <div className="bg-purple-50 p-4 rounded-lg">
                              <span className="font-semibold text-slate-700">Canaux: </span>
                              <span className="text-slate-600">{project.strategyChannels}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(project.actionPlan ||
                      project.actionSupports ||
                      project.actionCalendar ||
                      project.actionBudget) && (
                      <div className="relative pl-6 border-l-4 border-orange-500">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="h-5 w-5 text-orange-600" />
                          <h3 className="text-lg font-bold text-slate-900">4. Plan d&apos;action</h3>
                        </div>
                        <div className="space-y-3 ml-7">
                          {project.actionPlan && (
                            <div className="bg-orange-50 p-4 rounded-lg">
                              <span className="font-semibold text-slate-700">Actions: </span>
                              <span className="text-slate-600">{project.actionPlan}</span>
                            </div>
                          )}
                          {project.actionSupports && (
                            <div className="bg-orange-50 p-4 rounded-lg">
                              <span className="font-semibold text-slate-700">Supports: </span>
                              <span className="text-slate-600">{project.actionSupports}</span>
                            </div>
                          )}
                          {project.actionCalendar && (
                            <div className="bg-orange-50 p-4 rounded-lg">
                              <span className="font-semibold text-slate-700">Calendrier: </span>
                              <span className="text-slate-600">{project.actionCalendar}</span>
                            </div>
                          )}
                          {project.actionBudget && (
                            <div className="bg-orange-50 p-4 rounded-lg">
                              <span className="font-semibold text-slate-700">Budget: </span>
                              <span className="text-slate-600">{project.actionBudget}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(project.implementationContent ||
                      project.implementationLaunch ||
                      project.implementationTeams) && (
                      <div className="relative pl-6 border-l-4 border-indigo-500">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="h-5 w-5 text-indigo-600" />
                          <h3 className="text-lg font-bold text-slate-900">5. Mise en œuvre</h3>
                        </div>
                        <div className="space-y-3 ml-7">
                          {project.implementationContent && (
                            <div className="bg-indigo-50 p-4 rounded-lg">
                              <span className="font-semibold text-slate-700">
                                Création des contenus:{" "}
                              </span>
                              <span className="text-slate-600">
                                {project.implementationContent}
                              </span>
                            </div>
                          )}
                          {project.implementationLaunch && (
                            <div className="bg-indigo-50 p-4 rounded-lg">
                              <span className="font-semibold text-slate-700">Lancement: </span>
                              <span className="text-slate-600">
                                {project.implementationLaunch}
                              </span>
                            </div>
                          )}
                          {project.implementationTeams && (
                            <div className="bg-indigo-50 p-4 rounded-lg">
                              <span className="font-semibold text-slate-700">
                                Coordination des équipes:{" "}
                              </span>
                              <span className="text-slate-600">
                                {project.implementationTeams}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(project.evaluationMetrics ||
                      project.evaluationComparison ||
                      project.evaluationAdjustments) && (
                      <div className="relative pl-6 border-l-4 border-teal-500">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="h-5 w-5 text-teal-600" />
                          <h3 className="text-lg font-bold text-slate-900">6. Évaluation</h3>
                        </div>
                        <div className="space-y-3 ml-7">
                          {project.evaluationMetrics && (
                            <div className="bg-teal-50 p-4 rounded-lg">
                              <span className="font-semibold text-slate-700">
                                Mesure d&apos;efficacité:{" "}
                              </span>
                              <span className="text-slate-600">
                                {project.evaluationMetrics}
                              </span>
                            </div>
                          )}
                          {project.evaluationComparison && (
                            <div className="bg-teal-50 p-4 rounded-lg">
                              <span className="font-semibold text-slate-700">
                                Comparaison avec objectifs:{" "}
                              </span>
                              <span className="text-slate-600">
                                {project.evaluationComparison}
                              </span>
                            </div>
                          )}
                          {project.evaluationAdjustments && (
                            <div className="bg-teal-50 p-4 rounded-lg">
                              <span className="font-semibold text-slate-700">Ajustements: </span>
                              <span className="text-slate-600">
                                {project.evaluationAdjustments}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {!project.diagnosticContext &&
                      !project.objectives &&
                      !project.strategyPositioning &&
                      !project.strategyTargets &&
                      !project.strategyChannels &&
                      !project.actionPlan &&
                      !project.actionSupports &&
                      !project.actionCalendar &&
                      !project.actionBudget &&
                      !project.implementationContent &&
                      !project.implementationLaunch &&
                      !project.implementationTeams &&
                      !project.evaluationMetrics &&
                      !project.evaluationComparison &&
                      !project.evaluationAdjustments && (
                        <p className="text-muted-foreground italic">
                          Aucun détail renseigné pour ce projet.
                        </p>
                      )}
                  </CardContent>
                </Card>

                {/* Plan Actions */}
                <Card className="shadow-lg border-2">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100/50 border-b-2">
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="p-2 bg-orange-600 rounded-lg">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      Plan d&apos;Action
                      {planActions.length > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {planActions.length} action{planActions.length > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {planActions.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
                          <Calendar className="h-8 w-8 text-orange-400" />
                        </div>
                        <p className="text-muted-foreground font-medium">
                          Aucun plan d&apos;action défini
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-orange-50">
                              <TableHead className="font-bold text-slate-900">Action</TableHead>
                              <TableHead className="font-bold text-slate-900">
                                Date de début
                              </TableHead>
                              <TableHead className="font-bold text-slate-900">
                                Date de fin
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {planActions.map((action) => (
                              <TableRow key={action.id} className="hover:bg-orange-50/50">
                                <TableCell className="font-medium">{action.title}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-orange-600" />
                                    {formatDateTime(action.startDate)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    {formatDateTime(action.endDate)}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Project Actors */}
                <Card className="shadow-lg border-2">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b-2">
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      Acteurs du Projet
                      {actors.length > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {actors.length} acteur{actors.length > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {actors.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                          <Users className="h-8 w-8 text-blue-400" />
                        </div>
                        <p className="text-muted-foreground font-medium">
                          Aucun acteur défini
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-blue-50">
                              <TableHead className="font-bold text-slate-900">Nom</TableHead>
                              <TableHead className="font-bold text-slate-900">
                                Département
                              </TableHead>
                              <TableHead className="font-bold text-slate-900">Poste</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {actors.map((actor) => (
                              <TableRow key={actor.id} className="hover:bg-blue-50/50">
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                      {actor.name.charAt(0).toUpperCase()}
                                    </div>
                                    {actor.name}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-blue-600" />
                                    {actor.department}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-slate-600" />
                                    {actor.job}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Budget */}
                <Card className="shadow-lg border-2">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50 border-b-2">
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="p-2 bg-green-600 rounded-lg">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                      Budget du Projet
                      {budgetItems.length > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {budgetItems.length} élément{budgetItems.length > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {budgetItems.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                          <DollarSign className="h-8 w-8 text-green-400" />
                        </div>
                        <p className="text-muted-foreground font-medium">
                          Aucun élément de budget défini
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-green-50">
                              <TableHead className="font-bold text-slate-900">
                                Désignation
                              </TableHead>
                              <TableHead className="text-right font-bold text-slate-900">
                                Prix unitaire
                              </TableHead>
                              <TableHead className="text-right font-bold text-slate-900">
                                Quantité
                              </TableHead>
                              <TableHead className="text-right font-bold text-slate-900">
                                Montant
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {budgetItems.map((item) => (
                              <TableRow key={item.id} className="hover:bg-green-50/50">
                                <TableCell className="font-medium">{item.designation}</TableCell>
                                <TableCell className="text-right">
                                  {formatNumber(item.prixUnitaire)} FCFA
                                </TableCell>
                                <TableCell className="text-right">{item.quantite}</TableCell>
                                <TableCell className="text-right font-semibold text-green-700">
                                  {formatNumber(item.montant)} FCFA
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                          <TableFooter className="bg-gradient-to-r from-green-50 to-green-100">
                            <TableRow>
                              <TableCell colSpan={3} className="text-right font-bold text-lg">
                                TOTAL
                              </TableCell>
                              <TableCell className="text-right font-bold text-lg text-green-700">
                                {formatNumber(
                                  budgetItems.reduce((sum, item) => sum + item.montant, 0)
                                )}{" "}
                                FCFA
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actions réalisées (checked/completed) */}
                {(() => {
                  const completedActions = planActions.filter((a) => a.completed);
                  return (
                    <Card className="shadow-lg border-2">
                      <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b-2">
                        <CardTitle className="flex items-center gap-3 text-2xl">
                          <div className="p-2 bg-emerald-600 rounded-lg">
                            <CheckCircle2 className="h-6 w-6 text-white" />
                          </div>
                          Actions réalisées
                          {completedActions.length > 0 && (
                            <Badge variant="secondary" className="ml-auto">
                              {completedActions.length} action{completedActions.length > 1 ? "s" : ""} cochée
                              {completedActions.length > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          Toutes les actions cochées dans le cadre de ce projet
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        {completedActions.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                            </div>
                            <p className="text-muted-foreground font-medium">
                              Aucune action cochée pour ce projet
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-emerald-50">
                                  <TableHead className="font-bold text-slate-900">Action</TableHead>
                                  <TableHead className="font-bold text-slate-900">
                                    Date de début
                                  </TableHead>
                                  <TableHead className="font-bold text-slate-900">
                                    Date de fin
                                  </TableHead>
                                  <TableHead className="font-bold text-slate-900 w-12">
                                    Statut
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {completedActions.map((action) => (
                                  <TableRow key={action.id} className="hover:bg-emerald-50/50">
                                    <TableCell className="font-medium">{action.title}</TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-emerald-600" />
                                        {formatDateTime(action.startDate)}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                        {formatDateTime(action.endDate)}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge className="bg-emerald-600">Réalisée</Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Bottom: Export Word & Classer Projet buttons */}
          {project && (
            <div className="flex-shrink-0 pt-4 pb-2 border-t bg-background/95">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={exportToWord}
                  disabled={exporting}
                  size="lg"
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Export en cours...
                    </>
                  ) : (
                    <>
                      <FileDown className="mr-2 h-5 w-5" />
                      Export Word
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleClasserProjet}
                  disabled={classing || project.projectStatus !== "ACTIVE"}
                  size="lg"
                  variant={project.projectStatus === "ACTIVE" ? "default" : "secondary"}
                  className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-lg shadow-amber-500/30"
                >
                  {classing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Classement en cours...
                    </>
                  ) : (
                    <>
                      <Archive className="mr-2 h-5 w-5" />
                      Classer Projet
                    </>
                  )}
                </Button>
              </div>
              {project.projectStatus === "INACTIVE" && (
                <p className="text-sm text-muted-foreground mt-2">
                  Ce projet est déjà classé (inactif).
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
