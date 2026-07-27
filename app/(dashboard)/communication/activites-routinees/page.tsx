import ActivitesRoutineesTabsClient from "./ActivitesRoutineesTabsClient";
import { getActivitesProjetRoutine } from "@/lib/actions/activite-projet-routine";
import { getIndicateursObjectifMensuelProjetRoutine } from "@/lib/actions/indicateur-objectif-mensuel-projet-routine";
import {
  getRoleMissionsProjetRoutine,
  getUsersForRoleMission,
} from "@/lib/actions/role-mission-projet-routine";
import { getTachesActiviteProjetRoutine } from "@/lib/actions/tache-activite-projet-routine";

export default async function Page() {
  const [rolesResult, usersResult, objectifsResult, activitesResult, tachesResult] =
    await Promise.all([
      getRoleMissionsProjetRoutine(),
      getUsersForRoleMission(),
      getIndicateursObjectifMensuelProjetRoutine(),
      getActivitesProjetRoutine(),
      getTachesActiviteProjetRoutine(),
    ]);

  const loadErrors = [
    !rolesResult.success ? rolesResult.error : null,
    !usersResult.success ? usersResult.error : null,
    !objectifsResult.success ? objectifsResult.error : null,
    !activitesResult.success ? activitesResult.error : null,
    !tachesResult.success ? tachesResult.error : null,
  ].filter(Boolean);

  return (
    <ActivitesRoutineesTabsClient
      initialRoles={rolesResult.success ? rolesResult.roles : []}
      initialObjectifs={objectifsResult.success ? objectifsResult.objectifs : []}
      initialActivites={activitesResult.success ? activitesResult.activites : []}
      initialTaches={tachesResult.success ? tachesResult.taches : []}
      users={usersResult.success ? usersResult.users : []}
      loadError={loadErrors.length > 0 ? loadErrors.join(" · ") : null}
    />
  );
}
