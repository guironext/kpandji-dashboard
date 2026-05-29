import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table as DocxTable,
  TableCell as DocxTableCell,
  TableRow as DocxTableRow,
  TextRun,
  type FileChild,
} from "docx";
import type { CommunicationProjectDetail } from "@/lib/actions/communication-project";
import type { PlanActionWithActors } from "@/lib/actions/communication-plan-action";
import type { MiseEnOeuvreActorGroup } from "@/lib/actions/communication-mise-en-oeuvre";
import { getTaskStageConfig } from "@/lib/plan-action-task-stage";

function formatDateFr(date: Date | string): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "dd MMMM yyyy", { locale: fr });
  } catch {
    return String(date);
  }
}

function formatDateTimeFr(date: Date | string): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "dd MMMM yyyy 'à' HH:mm", { locale: fr });
  } catch {
    return String(date);
  }
}

function textWithLineBreaks(text: string): TextRun[] {
  const lines = String(text || "").split("\n");
  const result: TextRun[] = [];
  lines.forEach((line, i) => {
    result.push(new TextRun({ text: line }));
    if (i < lines.length - 1) {
      result.push(new TextRun({ break: 1 }));
    }
  });
  return result;
}

function fieldParagraph(label: string, value: string | null | undefined): Paragraph[] {
  if (!value?.trim()) return [];
  return [
    new Paragraph({
      children: [
        new TextRun({ text: `${label}: `, bold: true }),
        ...textWithLineBreaks(value),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({ text: "" }),
  ];
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 100 },
  });
}

function buildProjectDetailChildren(project: CommunicationProjectDetail): FileChild[] {
  const children: FileChild[] = [
    new Paragraph({
      text: "Résumé du projet",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Statut: ", bold: true }),
        new TextRun({
          text: project.projectStatus === "ACTIVE" ? "Actif" : "Terminé",
        }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Créé le: ", bold: true }),
        new TextRun({ text: formatDateFr(project.createdAt) }),
      ],
      spacing: { after: 100 },
    }),
  ];

  if (project.createdBy) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Créé par: ", bold: true }),
          new TextRun({
            text: `${project.createdBy.firstName} ${project.createdBy.lastName}`,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  if (project.diagnosticContext) {
    children.push(sectionHeading("1. Analyse de la situation (diagnostic)"));
    children.push(...fieldParagraph("Contexte", project.diagnosticContext));
    children.push(...fieldParagraph("Cible", project.diagnosticTarget));
    children.push(...fieldParagraph("Environnement", project.diagnosticEnvironment));
    children.push(...fieldParagraph("Forces/Faiblesses", project.diagnosticForces));
  }

  if (project.objectives) {
    children.push(sectionHeading("2. Définition des objectifs (SMART)"));
    children.push(...fieldParagraph("Objectifs", project.objectives));
  }

  if (
    project.strategyPositioning ||
    project.strategyTargets ||
    project.strategyChannels
  ) {
    children.push(sectionHeading("3. Stratégie"));
    children.push(...fieldParagraph("Positionnement", project.strategyPositioning));
    children.push(...fieldParagraph("Cibles prioritaires", project.strategyTargets));
    children.push(...fieldParagraph("Canaux", project.strategyChannels));
  }

  if (
    project.actionPlan ||
    project.actionSupports ||
    project.actionCalendar ||
    project.actionBudget
  ) {
    children.push(sectionHeading("4. Plan d'action (cadre)"));
    children.push(...fieldParagraph("Actions", project.actionPlan));
    children.push(...fieldParagraph("Supports", project.actionSupports));
    children.push(...fieldParagraph("Calendrier", project.actionCalendar));
    children.push(...fieldParagraph("Budget", project.actionBudget));
  }

  if (
    project.implementationContent ||
    project.implementationLaunch ||
    project.implementationTeams
  ) {
    children.push(sectionHeading("5. Mise en œuvre"));
    children.push(...fieldParagraph("Création des contenus", project.implementationContent));
    children.push(...fieldParagraph("Lancement", project.implementationLaunch));
    children.push(
      ...fieldParagraph("Coordination des équipes", project.implementationTeams)
    );
  }

  if (
    project.evaluationMetrics ||
    project.evaluationComparison ||
    project.evaluationAdjustments
  ) {
    children.push(sectionHeading("6. Évaluation"));
    children.push(...fieldParagraph("Mesure d'efficacité", project.evaluationMetrics));
    children.push(
      ...fieldParagraph("Comparaison avec objectifs", project.evaluationComparison)
    );
    children.push(...fieldParagraph("Ajustements", project.evaluationAdjustments));
  }

  return children;
}

function buildPlanActionsTable(planActions: PlanActionWithActors[]): FileChild[] {
  const children: FileChild[] = [
    new Paragraph({
      text: "Plan d'action — actions planifiées",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 600, after: 200 },
    }),
  ];

  if (planActions.length === 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Aucune action planifiée", italics: true })],
        spacing: { after: 200 },
      })
    );
    return children;
  }

  children.push(
    new DocxTable({
      columnWidths: [2800, 1800, 1800, 2200, 1200],
      rows: [
        new DocxTableRow({
          children: [
            new DocxTableCell({
              children: [
                new Paragraph({
                  text: "Action",
                  heading: HeadingLevel.HEADING_3,
                  spacing: { before: 120, after: 120 },
                }),
              ],
            }),
            new DocxTableCell({
              children: [
                new Paragraph({
                  text: "Date de début",
                  spacing: { before: 120, after: 120 },
                }),
              ],
            }),
            new DocxTableCell({
              children: [
                new Paragraph({
                  text: "Date de fin",
                  spacing: { before: 120, after: 120 },
                }),
              ],
            }),
            new DocxTableCell({
              children: [
                new Paragraph({
                  text: "Acteurs assignés",
                  spacing: { before: 120, after: 120 },
                }),
              ],
            }),
            new DocxTableCell({
              children: [
                new Paragraph({
                  text: "Statut",
                  spacing: { before: 120, after: 120 },
                }),
              ],
            }),
          ],
        }),
        ...planActions.map(
          (action) =>
            new DocxTableRow({
              children: [
                new DocxTableCell({
                  children: [
                    new Paragraph({
                      text: action.title,
                      spacing: { before: 120, after: 120 },
                    }),
                  ],
                }),
                new DocxTableCell({
                  children: [
                    new Paragraph({
                      text: formatDateTimeFr(action.startDate),
                      spacing: { before: 120, after: 120 },
                    }),
                  ],
                }),
                new DocxTableCell({
                  children: [
                    new Paragraph({
                      text: formatDateTimeFr(action.endDate),
                      spacing: { before: 120, after: 120 },
                    }),
                  ],
                }),
                new DocxTableCell({
                  children: [
                    new Paragraph({
                      text:
                        action.assignedActors.length > 0
                          ? action.assignedActors.map((a) => a.actor.name).join(", ")
                          : "—",
                      spacing: { before: 120, after: 120 },
                    }),
                  ],
                }),
                new DocxTableCell({
                  children: [
                    new Paragraph({
                      text: action.completed ? "Réalisée" : "En cours",
                      spacing: { before: 120, after: 120 },
                    }),
                  ],
                }),
              ],
            })
        ),
      ],
    })
  );

  return children;
}

function buildActorTasksSection(actorGroups: MiseEnOeuvreActorGroup[]): FileChild[] {
  const children: FileChild[] = [
    new Paragraph({
      text: "Tâches par acteurs",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 600, after: 200 },
    }),
  ];

  const withTasks = actorGroups.filter((g) =>
    g.actions.some((a) => a.tasks.length > 0)
  );

  if (withTasks.length === 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Aucune tâche enregistrée pour ce projet", italics: true }),
        ],
        spacing: { after: 200 },
      })
    );
    return children;
  }

  for (const { actor, actions } of withTasks) {
    children.push(
      new Paragraph({
        text: actor.name,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Département: ", bold: true }),
          new TextRun({ text: actor.department }),
          new TextRun({ text: " · Poste: ", bold: true }),
          new TextRun({ text: actor.job }),
        ],
        spacing: { after: 150 },
      })
    );

    const actionsWithTasks = actions.filter((a) => a.tasks.length > 0);
    for (const action of actionsWithTasks) {
      children.push(
        new Paragraph({
          text: action.title,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        }),
        new DocxTable({
          columnWidths: [3500, 2200, 2200],
          rows: [
            new DocxTableRow({
              children: [
                new DocxTableCell({
                  children: [
                    new Paragraph({
                      text: "Tâche",
                      spacing: { before: 120, after: 120 },
                    }),
                  ],
                }),
                new DocxTableCell({
                  children: [
                    new Paragraph({
                      text: "Période",
                      spacing: { before: 120, after: 120 },
                    }),
                  ],
                }),
                new DocxTableCell({
                  children: [
                    new Paragraph({
                      text: "Étape",
                      spacing: { before: 120, after: 120 },
                    }),
                  ],
                }),
              ],
            }),
            ...action.tasks.map(
              (task) =>
                new DocxTableRow({
                  children: [
                    new DocxTableCell({
                      children: [
                        new Paragraph({
                          text: task.title,
                          spacing: { before: 120, after: 120 },
                        }),
                      ],
                    }),
                    new DocxTableCell({
                      children: [
                        new Paragraph({
                          text: `${formatDateFr(task.startDate)} → ${formatDateFr(task.endDate)}`,
                          spacing: { before: 120, after: 120 },
                        }),
                      ],
                    }),
                    new DocxTableCell({
                      children: [
                        new Paragraph({
                          text: getTaskStageConfig(task.stage).label,
                          spacing: { before: 120, after: 120 },
                        }),
                      ],
                    }),
                  ],
                })
            ),
          ],
        })
      );
    }
  }

  return children;
}

export type RapportWordExportInput = {
  project: CommunicationProjectDetail;
  planActions: PlanActionWithActors[];
  actorGroups: MiseEnOeuvreActorGroup[];
};

export function getRapportWordFileName(projectName: string): string {
  const safeName = projectName.replace(/[^a-zA-Z0-9]/g, "_");
  return `Rapport_Projet_${safeName}_${format(new Date(), "yyyy-MM-dd")}.docx`;
}

export async function buildRapportProjetWordBlob(
  input: RapportWordExportInput
): Promise<Blob> {
  const { project, planActions, actorGroups } = input;

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: project.name,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: `Rapport des projets — ${formatDateFr(new Date())}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
          }),
          ...buildProjectDetailChildren(project),
          ...buildPlanActionsTable(planActions),
          ...buildActorTasksSection(actorGroups),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}
