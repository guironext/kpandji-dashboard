import TachesEnCoursKanban from "./TachesEnCoursKanban";
import { getActivitesProjetRoutine } from "@/lib/actions/activite-projet-routine";
import { getTachesActiviteProjetRoutine } from "@/lib/actions/tache-activite-projet-routine";

export default async function TachesEnCoursPage() {
  const [tachesResult, activitesResult] = await Promise.all([
    getTachesActiviteProjetRoutine(),
    getActivitesProjetRoutine(),
  ]);

  return (
    <TachesEnCoursKanban
      initialTaches={tachesResult.success ? tachesResult.taches : []}
      activites={activitesResult.success ? activitesResult.activites : []}
    />
  );
}
