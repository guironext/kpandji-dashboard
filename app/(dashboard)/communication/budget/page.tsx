import { getActiveCommunicationProjects } from "@/lib/actions/communication-project";
import { getBudgetItemsByProjectId, type CommunicationBudgetItem } from "@/lib/actions/communication-budget";
import type { CommunicationProjectListItem } from "@/lib/actions/communication-project";
import BudgetClient from "./BudgetClient";

export default async function BudgetPage() {
  let projects: CommunicationProjectListItem[] = [];
  let firstProjectId: string | null = null;
  let initialItemsResolved: CommunicationBudgetItem[] = [];
  let error: string | null = null;

  try {
    const projectsResult = await getActiveCommunicationProjects();
    projects = projectsResult.success ? projectsResult.projects : [];
    firstProjectId = projects[0]?.id ?? null;
    
    if (firstProjectId) {
      const initialItems = await getBudgetItemsByProjectId(firstProjectId);
      initialItemsResolved = initialItems && initialItems.success ? initialItems.items : [];
    }
  } catch (err) {
    console.error("Error in BudgetPage:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    
    // Check for connection errors
    const errorString = errorMessage.toLowerCase();
    const isConnectionError = 
      errorMessage.includes("connection") || 
      errorMessage.includes("connexion") || 
      errorMessage.includes("Can't reach database server") ||
      errorMessage.includes("database server") ||
      errorString.includes("p1001") ||
      errorString.includes("connection closed") ||
      errorString.includes("postgresql connection");
    
    if (isConnectionError) {
      error = "Erreur de connexion à la base de données. Veuillez vérifier que le serveur de base de données est accessible et réessayer.";
    } else {
      error = "Une erreur inattendue s'est produite lors du chargement des données.";
    }
  }

  return (
    <div className="min-h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.14),transparent)] bg-slate-50">
      <div className="relative min-h-full">
        {/* Decorative gradient orbs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -left-40 top-0 h-80 w-80 rounded-full bg-violet-300/25 blur-3xl" />
          <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-amber-200/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        </div>
        <BudgetClient
          projects={projects}
          initialItems={initialItemsResolved}
          selectedProjectId={firstProjectId}
          error={error}
        />
      </div>
    </div>
  );
}