import { getActiveCommunicationProjects } from "@/lib/actions/communication-project";
import ResumeProjetClient from "./ResumeProjetClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Résumé des Projets | Communication",
  description: "Vue d'ensemble complète des projets de communication",
};

export default async function ResumeProjetPage() {
  const projectsResult = await getActiveCommunicationProjects();
  const projects = projectsResult.success ? projectsResult.projects : [];

  return <ResumeProjetClient projects={projects} />;
}