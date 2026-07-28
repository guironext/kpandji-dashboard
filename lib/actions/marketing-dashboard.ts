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

export type MarketingDashboardData = CommunityManagerDashboardData;
export type MarketingDashboardPerson = CmDashboardPerson;
export type MarketingProjetPonctuelItem = CmProjetPonctuelItem;
export type MarketingProjetPonctuelActiviteItem = CmProjetPonctuelActiviteItem;
export type MarketingActiviteRoutineItem = CmActiviteRoutineItem;
export type MarketingTacheRoutineItem = CmTacheRoutineItem;

/**
 * Dashboard Marketing — projets ponctuels & routine dont l'utilisateur
 * connecté est responsable (même logique d'affectation que Community Manager).
 */
export async function getMarketingDashboard(clerkUserId?: string) {
  return getCommunityManagerDashboard(clerkUserId);
}
