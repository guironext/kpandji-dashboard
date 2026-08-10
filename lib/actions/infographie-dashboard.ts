"use server";

import {
  getCommunityManagerDashboard,
  type CommunityManagerDashboardData,
  type CmActiviteRoutineItem,
  type CmDashboardPerson,
  type CmProjetPonctuelActiviteItem,
  type CmProjetPonctuelItem,
  type CmTacheRoutineItem,
} from "./community-manager-dashboard";

export type InfographieDashboardData = CommunityManagerDashboardData;
export type InfographieDashboardPerson = CmDashboardPerson;
export type InfographieProjetPonctuelItem = CmProjetPonctuelItem;
export type InfographieProjetPonctuelActiviteItem = CmProjetPonctuelActiviteItem;
export type InfographieActiviteRoutineItem = CmActiviteRoutineItem;
export type InfographieTacheRoutineItem = CmTacheRoutineItem;

/**
 * Dashboard Infographie — projets ponctuels & routine dont l'utilisateur
 * connecté est responsable (même logique d'affectation que Community Manager).
 */
export async function getInfographieDashboard(clerkUserId?: string) {
  return getCommunityManagerDashboard(clerkUserId);
}
