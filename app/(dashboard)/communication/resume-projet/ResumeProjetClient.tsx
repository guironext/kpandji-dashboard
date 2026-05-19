"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getCommunicationProjectById,
  deleteCommunicationProject,
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
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Document, Packer, Paragraph, TextRun, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, AlignmentType, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import { useRouter } from "next/navigation";
import ResumeProjetView from "./ResumeProjetView";
import { EMBEDDED_ACCENT, STANDALONE_ACCENT } from "./resume-projet-ui";

type ProjectListItem = {
  id: string;
  name: string;
  projectStatus: "ACTIVE" | "INACTIVE";
};

type Props = {
  projects: ProjectListItem[];
  embedded?: boolean;
};

export default function ResumeProjetClient({ projects, embedded = false }: Props) {
  const accent = embedded ? EMBEDDED_ACCENT : STANDALONE_ACCENT;
  const router = useRouter();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects[0]?.id ?? null
  );
  const [project, setProject] = useState<CommunicationProjectDetail | null>(null);
  const [planActions, setPlanActions] = useState<PlanActionItem[]>([]);
  const [actors, setActors] = useState<CommunicationProjectActor[]>([]);
  const [budgetItems, setBudgetItems] = useState<CommunicationBudgetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const activeProjects = projects.filter((p) => p.projectStatus === "ACTIVE");

  const budgetTotal = useMemo(
    () => budgetItems.reduce((sum, item) => sum + item.montant, 0),
    [budgetItems]
  );

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

  const textWithLineBreaks = (text: string): TextRun[] => {
    const lines = String(text || "").split("\n");
    const result: TextRun[] = [];
    lines.forEach((line, i) => {
      result.push(new TextRun({ text: line }));
      if (i < lines.length - 1) {
        result.push(new TextRun({ break: 1 }));
      }
    });
    return result;
  };

  const exportToWord = async () => {
    if (!project) {
      toast.error("Aucun projet sélectionné");
      return;
    }

    setExporting(true);
    try {
      // Ensure arrays are defined
      const safePlanActions = Array.isArray(planActions) ? planActions : [];
      const safeActors = Array.isArray(actors) ? actors : [];
      const safeBudgetItems = Array.isArray(budgetItems) ? budgetItems : [];
      
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // Title
              new Paragraph({
                text: project.name,
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
                
              }),
              new Paragraph({
                text: `Résumé du projet - ${formatDate(new Date())}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 },
              }),

              // Project Details Section
              new Paragraph({
                text: "Détails du projet",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
              }),

              ...(project.diagnosticContext
                ? [
                    new Paragraph({
                      text: "1. Analyse de la situation (diagnostic)",
                      heading: HeadingLevel.HEADING_2,
                      spacing: { before: 300, after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({ text: "Contexte: ", bold: true }),
                        ...textWithLineBreaks(project.diagnosticContext || "Non renseigné"),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({ text: "" }),
                    ...(project.diagnosticTarget
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Cible: ", bold: true }),
                              ...textWithLineBreaks(project.diagnosticTarget),
                            ],
                            spacing: { after: 100 },
                          }),
                          new Paragraph({ text: "" }),
                        ]
                      : []),
                    ...(project.diagnosticEnvironment
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Environnement: ", bold: true }),
                              ...textWithLineBreaks(project.diagnosticEnvironment),
                            ],
                            spacing: { after: 100 },
                          }),
                          new Paragraph({ text: "" }),
                        ]
                      : []),
                    ...(project.diagnosticForces
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Forces/Faiblesses: ", bold: true }),
                              ...textWithLineBreaks(project.diagnosticForces),
                            ],
                            spacing: { after: 200 },
                          }),
                          new Paragraph({ text: "" }),
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
                        ...textWithLineBreaks(project.objectives),
                      ],
                      spacing: { after: 200 },
                    }),
                    new Paragraph({ text: "" }),
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
                              ...textWithLineBreaks(project.strategyPositioning),
                            ],
                            spacing: { after: 100 },
                          }),
                          new Paragraph({ text: "" }),
                        ]
                      : []),
                    ...(project.strategyTargets
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Cibles prioritaires: ", bold: true }),
                              ...textWithLineBreaks(project.strategyTargets),
                            ],
                            spacing: { after: 100 },
                          }),
                          new Paragraph({ text: "" }),
                        ]
                      : []),
                    ...(project.strategyChannels
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Canaux: ", bold: true }),
                              ...textWithLineBreaks(project.strategyChannels),
                            ],
                            spacing: { after: 200 },
                          }),
                          new Paragraph({ text: "" }),
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
                              ...textWithLineBreaks(project.actionPlan),
                            ],
                            spacing: { after: 100 },
                          }),
                          new Paragraph({ text: "" }),
                        ]
                      : []),
                    ...(project.actionSupports
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Supports: ", bold: true }),
                              ...textWithLineBreaks(project.actionSupports),
                            ],
                            spacing: { after: 100 },
                          }),
                          new Paragraph({ text: "" }),
                        ]
                      : []),
                    ...(project.actionCalendar
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Calendrier: ", bold: true }),
                              ...textWithLineBreaks(project.actionCalendar),
                            ],
                            spacing: { after: 100 },
                          }),
                          new Paragraph({ text: "" }),
                        ]
                      : []),
                    ...(project.actionBudget
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Budget: ", bold: true }),
                              ...textWithLineBreaks(project.actionBudget),
                            ],
                            spacing: { after: 200 },
                          }),
                          new Paragraph({ text: "" }),
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
                              ...textWithLineBreaks(project.implementationContent),
                            ],
                            spacing: { after: 100 },
                          }),
                          new Paragraph({ text: "" }),
                        ]
                      : []),
                    ...(project.implementationLaunch
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Lancement: ", bold: true }),
                              ...textWithLineBreaks(project.implementationLaunch),
                            ],
                            spacing: { after: 100 },
                          }),
                          new Paragraph({ text: "" }),
                        ]
                      : []),
                    ...(project.implementationTeams
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Coordination des équipes: ", bold: true }),
                              ...textWithLineBreaks(project.implementationTeams),
                            ],
                            spacing: { after: 200 },
                          }),
                          new Paragraph({ text: "" }),
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
                              ...textWithLineBreaks(project.evaluationMetrics),
                            ],
                            spacing: { after: 100 },
                          }),
                          new Paragraph({ text: "" }),
                        ]
                      : []),
                    ...(project.evaluationComparison
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Comparaison avec objectifs: ", bold: true }),
                              ...textWithLineBreaks(project.evaluationComparison),
                            ],
                            spacing: { after: 100 },
                          }),
                          new Paragraph({ text: "" }),
                        ]
                      : []),
                    ...(project.evaluationAdjustments
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Ajustements: ", bold: true }),
                              ...textWithLineBreaks(project.evaluationAdjustments),
                            ],
                            spacing: { after: 200 },
                          }),
                          new Paragraph({ text: "" }),
                        ]
                      : []),
                  ]
                : []),

              // Plan Actions Section
              new Paragraph({
                text: "Plan d'action",
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
                              children: [new Paragraph({ text: "Action", heading: HeadingLevel.HEADING_3, spacing: { before: 120, after: 120 } })],
                            }),
                            new DocxTableCell({
                              children: [new Paragraph({ text: "Date de début", spacing: { before: 120, after: 120 } })],
                            }),
                            new DocxTableCell({
                              children: [new Paragraph({ text: "Date de fin", spacing: { before: 120, after: 120 } })],
                            }),
                          ],
                        }),
                        ...safePlanActions.map(
                          (action) =>
                            new DocxTableRow({
                              children: [
                                new DocxTableCell({
                                  children: [new Paragraph({ text: action.title, spacing: { before: 120, after: 120 } })],
                                }),
                                new DocxTableCell({
                                  children: [new Paragraph({ text: formatDateTime(action.startDate), spacing: { before: 120, after: 120 } })],
                                }),
                                new DocxTableCell({
                                  children: [new Paragraph({ text: formatDateTime(action.endDate), spacing: { before: 120, after: 120 } })],
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

              // Actors Section
              new Paragraph({
                text: "Acteurs du projet",
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
                              children: [new Paragraph({ text: "Nom", heading: HeadingLevel.HEADING_3, spacing: { before: 120, after: 120 } })],
                            }),
                            new DocxTableCell({
                              children: [new Paragraph({ text: "Département", spacing: { before: 120, after: 120 } })],
                            }),
                            new DocxTableCell({
                              children: [new Paragraph({ text: "Poste", spacing: { before: 120, after: 120 } })],
                            }),
                          ],
                        }),
                        ...safeActors.map(
                          (actor) =>
                            new DocxTableRow({
                              children: [
                                new DocxTableCell({
                                  children: [new Paragraph({ text: actor.name, spacing: { before: 120, after: 120 } })],
                                }),
                                new DocxTableCell({
                                  children: [new Paragraph({ text: actor.department, spacing: { before: 120, after: 120 } })],
                                }),
                                new DocxTableCell({
                                  children: [new Paragraph({ text: actor.job, spacing: { before: 120, after: 120 } })],
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

              // Budget Section
              new Paragraph({
                text: "Budget du projet",
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
                              children: [new Paragraph({ text: "Désignation", heading: HeadingLevel.HEADING_3, spacing: { before: 120, after: 120 } })],
                            }),
                            new DocxTableCell({
                              children: [new Paragraph({ text: "Prix unitaire", spacing: { before: 120, after: 120 } })],
                            }),
                            new DocxTableCell({
                              children: [new Paragraph({ text: "Quantité", spacing: { before: 120, after: 120 } })],
                            }),
                            new DocxTableCell({
                              children: [new Paragraph({ text: "Montant", spacing: { before: 120, after: 120 } })],
                            }),
                          ],
                        }),
                        ...safeBudgetItems.map(
                          (item) =>
                            new DocxTableRow({
                              children: [
                                new DocxTableCell({
                                  children: [new Paragraph({ text: item.designation, spacing: { before: 120, after: 120 } })],
                                }),
                                new DocxTableCell({
                                  children: [new Paragraph({ text: formatNumber(item.prixUnitaire) + " FCFA", spacing: { before: 120, after: 120 } })],
                                }),
                                new DocxTableCell({
                                  children: [new Paragraph({ text: String(item.quantite), spacing: { before: 120, after: 120 } })],
                                }),
                                new DocxTableCell({
                                  children: [new Paragraph({ text: formatNumber(item.montant) + " FCFA", spacing: { before: 120, after: 120 } })],
                                }),
                              ],
                            })
                        ),
                        new DocxTableRow({
                          children: [
                            new DocxTableCell({
                              children: [new Paragraph({ children: [new TextRun({ text: "TOTAL", bold: true })], spacing: { before: 120, after: 120 } })],
                            }),
                            new DocxTableCell({
                              children: [new Paragraph({ text: "", spacing: { before: 120, after: 120 } })],
                            }),
                            new DocxTableCell({
                              children: [new Paragraph({ text: "", spacing: { before: 120, after: 120 } })],
                            }),
                            new DocxTableCell({
                              children: [
                                new Paragraph({
                                  children: [
                                    new TextRun({
                                      text: formatNumber(
                                        safeBudgetItems.reduce((sum, item) => sum + item.montant, 0)
                                      ) + " FCFA",
                                      bold: true,
                                    }),
                                  ],
                                  spacing: { before: 120, after: 120 },
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
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const fileName = `Resume_Projet_${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.docx`;
      saveAs(blob, fileName);
      toast.success("Document Word exporté avec succès");
    } catch (error) {
      console.error("Error exporting to Word:", error);
      toast.error("Erreur lors de l'exportation du document Word");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project || !selectedProjectId) {
      toast.error("Aucun projet sélectionné");
      return;
    }

    setDeleting(true);
    try {
      const result = await deleteCommunicationProject(selectedProjectId);
      
      if (result.success) {
        toast.success(`Le projet "${project.name}" a été supprimé avec succès`);
        setShowDeleteDialog(false);
        
        // Clear current project data
        setProject(null);
        setPlanActions([]);
        setActors([]);
        setBudgetItems([]);
        
        // Select the first available project or null
        const remainingProjects = projects.filter((p) => p.id !== selectedProjectId);
        const nextProjectId = remainingProjects.length > 0 ? remainingProjects[0].id : null;
        setSelectedProjectId(nextProjectId);
        
        // Refresh the page to update the projects list
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la suppression du projet");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Erreur lors de la suppression du projet");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ResumeProjetView
      embedded={embedded}
      accent={accent}
      activeProjects={activeProjects}
      selectedProjectId={selectedProjectId}
      onSelectProject={setSelectedProjectId}
      loading={loading}
      project={project}
      planActions={planActions}
      actors={actors}
      budgetItems={budgetItems}
      budgetTotal={budgetTotal}
      exporting={exporting}
      deleting={deleting}
      showDeleteDialog={showDeleteDialog}
      onShowDeleteDialog={setShowDeleteDialog}
      onExport={exportToWord}
      onDelete={handleDeleteProject}
      formatDate={formatDate}
      formatDateTime={formatDateTime}
      formatNumber={formatNumber}
    />
  );
}
