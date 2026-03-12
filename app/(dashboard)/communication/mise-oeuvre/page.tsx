import { getCommunicationProjects } from "@/lib/actions/communication-project";
import { getPlanActionsByProjectId } from "@/lib/actions/communication-plan-action";
import MiseOeuvreClient from "./MiseOeuvreClient";

export default async function MiseOeuvrePage() {
  const projectsResult = await getCommunicationProjects();
  const projects = projectsResult.success ? projectsResult.projects : [];
  const firstProjectId = projects[0]?.id ?? null;
  const initialActions = firstProjectId
    ? (await getPlanActionsByProjectId(firstProjectId))
    : { success: false as const, actions: [] };
  const initialActionsResolved =
    initialActions.success ? initialActions.actions : [];

  return (
    <div className="min-h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.14),transparent)] bg-slate-50">
      <div className="relative min-h-full">
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -left-40 top-0 h-80 w-80 rounded-full bg-violet-300/25 blur-3xl" />
          <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-amber-200/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        </div>
        <MiseOeuvreClient
          projects={projects}
          initialActions={initialActionsResolved}
          selectedProjectId={firstProjectId}
        />
      </div>
    </div>
  );
}
