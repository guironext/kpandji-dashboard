import { getCommunicationProjects } from "@/lib/actions/communication-project";
import MiseEnOeuvreClient from "./MiseEnOeuvreClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mise en œuvre | Communication",
  description: "Suivi des tâches du plan d'action par projet, action et acteur",
};

export default async function MiseEnOeuvrePage() {
  const result = await getCommunicationProjects();
  const projects = result.success ? result.projects : [];

  return <MiseEnOeuvreClient projects={projects} />;
}
