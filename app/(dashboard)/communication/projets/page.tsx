import { getCommunicationProjects } from "@/lib/actions/communication-project";
import { getPlanActionsByProjectId } from "@/lib/actions/communication-plan-action";
import { getBudgetItemsByProjectId } from "@/lib/actions/communication-budget";
import type { CommunicationBudgetItem } from "@/lib/actions/communication-budget";
import type { PlanActionItem } from "@/lib/actions/communication-plan-action";
import ProjetsTabsClient from "./ProjetsTabsClient";

export default async function ProjetsPage() {
  try {
    const projectsResult = await getCommunicationProjects();
    const projects = projectsResult.success && projectsResult.projects ? projectsResult.projects : [];

    const firstProjectId = projects[0]?.id ?? null;
    let initialPlanActions: PlanActionItem[] = [];
    let initialBudgetItems: CommunicationBudgetItem[] = [];
    let budgetError: string | null = null;

    if (firstProjectId) {
      const [planResult, budgetResult] = await Promise.all([
        getPlanActionsByProjectId(firstProjectId),
        getBudgetItemsByProjectId(firstProjectId),
      ]);
      if (planResult.success && planResult.actions) {
        initialPlanActions = planResult.actions;
      }
      if (budgetResult.success && "items" in budgetResult) {
        initialBudgetItems = budgetResult.items;
      } else if (!budgetResult.success) {
        budgetError = budgetResult.error ?? null;
      }
    }

    return (
      <ProjetsTabsClient
        projects={projects}
        initialPlanActions={initialPlanActions}
        initialBudgetItems={initialBudgetItems}
        budgetError={budgetError}
      />
    );
  } catch (error) {
    console.error("ProjetsPage error:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 max-w-md">
          <h2 className="text-lg font-bold text-red-800">Erreur serveur</h2>
          <p className="mt-2 text-sm text-red-700">{message}</p>
          <p className="mt-2 text-xs text-red-600">
            Vérifiez DATABASE_URL dans .env et que la base de données est accessible.
          </p>
        </div>
      </div>
    );
  }
}
