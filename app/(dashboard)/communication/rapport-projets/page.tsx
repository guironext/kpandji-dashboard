import { getCommunicationProjectsForReport } from "@/lib/actions/communication-project";
import RapportProjetsClient from "./RapportProjetsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rapport des projets | Communication",
  description: "Clôture et synthèse des projets de communication",
};

export default async function RapportProjetsPage() {
  const result = await getCommunicationProjectsForReport();
  const projects = result.success ? result.projects : [];

  return <RapportProjetsClient projects={projects} />;
}
