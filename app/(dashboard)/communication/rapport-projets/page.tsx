import { getCommunicationProjectsForReport } from "@/lib/actions/communication-project";
import RapportProjetsClient from "./RapportProjetsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rapport des Projets | Communication",
  description: "Rapport de tous les projets de communication, du plus récent au plus ancien",
};

export default async function RapportProjetsPage() {
  const result = await getCommunicationProjectsForReport();
  const projects = result.success ? result.projects : [];

  return <RapportProjetsClient projects={projects} />;
}
