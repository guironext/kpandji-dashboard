import type { Metadata } from "next";
import { getProjetPonctuels } from "@/lib/actions/projet-ponctuel";
import ProjetsPonctuelsTabsClient from "./ProjetsPonctuelsTabsClient";

export const metadata: Metadata = {
  title: "Projets ponctuels | Communication",
  description: "Génération, activités, mise en œuvre et performances des projets ponctuels",
};

export default async function ProjetsPonctuelsPage() {
  const result = await getProjetPonctuels();
  const initialProjects = result.success ? result.projects : [];

  return <ProjetsPonctuelsTabsClient initialProjects={initialProjects} />;
}
