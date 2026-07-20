import type { ProjetPonctuelListItem } from "@/lib/actions/projet-ponctuel";
import type { ProjetPonctuelActiviteItem } from "@/lib/actions/projet-ponctuel-activite";

export function allActivitesTerminees(activites: ProjetPonctuelActiviteItem[]) {
  return activites.length > 0 && activites.every((a) => a.statutActivite === "TERMINEE");
}

export function applyProjetCompletionUpdate(
  projet: ProjetPonctuelListItem | null | undefined,
  currentStatut: ProjetPonctuelListItem["statutProjet"] | undefined,
  onProjectUpdated?: (project: ProjetPonctuelListItem) => void
): boolean {
  if (!projet || projet.statutProjet !== "TERMINEE") return false;
  onProjectUpdated?.(projet);
  return currentStatut !== "TERMINEE";
}
