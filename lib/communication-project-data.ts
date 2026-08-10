export type CommunicationProjectInput = {
  name: string;
  createdById?: string | null;
  diagnosticContext?: string | null;
  diagnosticTarget?: string | null;
  diagnosticEnvironment?: string | null;
  diagnosticForces?: string | null;
  objectives?: string | null;
  strategyPositioning?: string | null;
  strategyTargets?: string | null;
  strategyChannels?: string | null;
  actionPlan?: string | null;
  actionSupports?: string | null;
  actionCalendar?: string | null;
  actionBudget?: string | null;
  implementationContent?: string | null;
  implementationLaunch?: string | null;
  implementationTeams?: string | null;
  evaluationMetrics?: string | null;
  evaluationComparison?: string | null;
  evaluationAdjustments?: string | null;
};

function optionalText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

export function buildProjectCreateData(
  data: CommunicationProjectInput,
  createdById?: string | null,
) {
  return {
    name: data.name.trim(),
    createdById: createdById ?? data.createdById ?? undefined,
    diagnosticContext: optionalText(data.diagnosticContext),
    diagnosticTarget: optionalText(data.diagnosticTarget),
    diagnosticEnvironment: optionalText(data.diagnosticEnvironment),
    diagnosticForces: optionalText(data.diagnosticForces),
    objectives: optionalText(data.objectives),
    strategyPositioning: optionalText(data.strategyPositioning),
    strategyTargets: optionalText(data.strategyTargets),
    strategyChannels: optionalText(data.strategyChannels),
    actionPlan: optionalText(data.actionPlan),
    actionSupports: optionalText(data.actionSupports),
    actionCalendar: optionalText(data.actionCalendar),
    actionBudget: optionalText(data.actionBudget),
    implementationContent: optionalText(data.implementationContent),
    implementationLaunch: optionalText(data.implementationLaunch),
    implementationTeams: optionalText(data.implementationTeams),
    evaluationMetrics: optionalText(data.evaluationMetrics),
    evaluationComparison: optionalText(data.evaluationComparison),
    evaluationAdjustments: optionalText(data.evaluationAdjustments),
  };
}
