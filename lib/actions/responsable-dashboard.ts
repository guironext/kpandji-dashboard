"use server";

import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "./user";
import { prisma } from "../prisma";
import { getTableauChuteRendezVousByObjectifPeriodAndCommercial } from "./tableau-chute";
import {
  getRapportRendezVousByObjectifPeriod,
  getObjectifsCibleByPeriodAndCommercial,
  getObjectifsFinancieresByPoleAndCommercial,
  getObjectifsVehiculesByPeriodAndCommercial,
} from "./rapport-rendez-vous-analytics";
import { getObjectifPeriods } from "./objectif-period";

export type ResponsableDashboardData = {
  periodsCount: number;
  totalChutes: number;
  totalCommercialsWithChutes: number;
  totalRapportsProspects: number;
  totalRapportsClients: number;
  totalRapports: number;
  objectifsCibleCount: number;
  objectifsFinancieresCount: number;
  objectifsVehiculesCount: number;
  commercialsCount: number;
  prospectsCount: number;
  clientsCount: number;
  facturesEnAttenteCount: number;
  facturesValideesCount: number;
  currentPeriodLabel: string | null;
};

export async function getResponsableDashboard(): Promise<{
  success: boolean;
  data?: ResponsableDashboardData;
  error?: string;
}> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { success: false, error: "Non authentifié" };
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    const allowedRoles = ["RESPONSABLE_COMMERCIAL", "ADMIN"];
    if (!allowedRoles.includes(userResult.data.role)) {
      return { success: false, error: "Non autorisé" };
    }

    const [
      periodsResult,
      chuteResult,
      rapportResult,
      cibleResult,
      financieresResult,
      vehiculesResult,
    ] = await Promise.all([
      getObjectifPeriods(),
      getTableauChuteRendezVousByObjectifPeriodAndCommercial(),
      getRapportRendezVousByObjectifPeriod(),
      getObjectifsCibleByPeriodAndCommercial(),
      getObjectifsFinancieresByPoleAndCommercial(),
      getObjectifsVehiculesByPeriodAndCommercial(),
    ]);

    const periodsCount = periodsResult.success && periodsResult.data ? periodsResult.data.length : 0;

    let totalChutes = 0;
    let totalCommercialsWithChutes = 0;
    if (chuteResult.success && chuteResult.data?.periods) {
      for (const period of chuteResult.data.periods) {
        totalChutes += period.commercials.reduce(
          (sum: number, comm: { totalChutes: number }) => sum + comm.totalChutes,
          0
        );
      }
      totalCommercialsWithChutes = new Set(
        chuteResult.data.periods.flatMap((period) =>
          period.commercials.map((comm) => comm.commercialId)
        )
      ).size;
    }

    let totalRapportsProspects = 0;
    let totalRapportsClients = 0;
    if (rapportResult.success && rapportResult.data?.periods) {
      for (const p of rapportResult.data.periods) {
        totalRapportsProspects += p.prospects.length;
        totalRapportsClients += p.clients.length;
      }
    }
    const totalRapports = totalRapportsProspects + totalRapportsClients;

    const objectifsCibleCount = cibleResult.success && cibleResult.data ? cibleResult.data.length : 0;
    const objectifsFinancieresCount =
      financieresResult.success && financieresResult.data ? financieresResult.data.length : 0;
    const objectifsVehiculesCount =
      vehiculesResult.success && vehiculesResult.data ? vehiculesResult.data.length : 0;

    const [
      commercialsCount,
      clientProspects,
      clientClients,
      entrepriseProspects,
      entrepriseClients,
      facturesEnAttente,
      facturesValidees,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "COMMERCIAL" } }),
      prisma.client.count({ where: { status_client: "PROSPECT" } }),
      prisma.client.count({ where: { status_client: "CLIENT" } }),
      prisma.client_entreprise.count({ where: { status_client: "PROSPECT" } }),
      prisma.client_entreprise.count({ where: { status_client: "CLIENT" } }),
      prisma.facture.count({ where: { status_facture: "EN_ATTENTE" } }),
      prisma.facture.count({ where: { status_facture: "FACTURE" } }),
    ]);

    const prospectsCountTotal = clientProspects + entrepriseProspects;
    const clientsCountTotal = clientClients + entrepriseClients;

    let currentPeriodLabel: string | null = null;
    if (periodsResult.success && periodsResult.data && periodsResult.data.length > 0) {
      const p = periodsResult.data[0];
      const startStr = new Date(p.start).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const endStr = new Date(p.end).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      currentPeriodLabel = `${startStr} — ${endStr}`;
    }

    const data: ResponsableDashboardData = {
      periodsCount,
      totalChutes,
      totalCommercialsWithChutes,
      totalRapportsProspects,
      totalRapportsClients,
      totalRapports,
      objectifsCibleCount,
      objectifsFinancieresCount,
      objectifsVehiculesCount,
      commercialsCount,
      prospectsCount: prospectsCountTotal,
      clientsCount: clientsCountTotal,
      facturesEnAttenteCount: facturesEnAttente,
      facturesValideesCount: facturesValidees,
      currentPeriodLabel,
    };

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching responsable dashboard:", error);
    return {
      success: false,
      error: "Échec du chargement du tableau de bord",
    };
  }
}
