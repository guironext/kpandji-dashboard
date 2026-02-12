import { getCommunicationProjects } from "@/lib/actions/communication-project";
import ProjetsClient from "./ProjetsClient";

export default async function ProjetsPage() {
  const result = await getCommunicationProjects();
  const projects = result.success && result.projects ? result.projects : [];

  return (
    <div className="min-h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),transparent)] bg-slate-50">
      <div className="relative min-h-full">
        {/* Decorative gradient orbs - subtle */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -left-40 top-0 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl" />
          <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-amber-200/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-300/15 blur-3xl" />
        </div>
        <ProjetsClient initialProjects={projects} />
      </div>
    </div>
  );
}
