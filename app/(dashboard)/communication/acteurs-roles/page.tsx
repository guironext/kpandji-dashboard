import { getActiveCommunicationProjects } from "@/lib/actions/communication-project";
import ActeursRolesClient from "./ActeursRolesClient";

export default async function ActeursRolesPage() {
  const projectsResult = await getActiveCommunicationProjects();
  const projects = projectsResult.success ? projectsResult.projects : [];

  return <ActeursRolesClient initialProjects={projects} />;
}