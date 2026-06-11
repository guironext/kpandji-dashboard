"use server";

import { auth } from "@clerk/nextjs/server";
import { EtapeConteneur, EtapeMontage } from "@prisma/client";
import { prisma } from "../prisma";

export type ManagerDashboardData = {
  conteneursCharges: number;
  conteneursTransit: number;
  conteneursArrives: number;
  totalCommandes: number;
  agendaToday: number;
  montagesActifs: number;
  commandesDisponibles: number;
  commandesVendues: number;
};

export async function getManagerDashboard(): Promise<{
  success: boolean;
  data?: ManagerDashboardData;
  error?: string;
}> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Non authentifié" };
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const transitSteps: EtapeConteneur[] = [
      EtapeConteneur.TRANSITE,
      EtapeConteneur.TRANSITE_NON_RENSEIGNE,
      EtapeConteneur.TRANSITE_DEJA_RENSEIGNE,
      EtapeConteneur.RENSEIGNE,
    ];

    const arrivedSteps: EtapeConteneur[] = [
      EtapeConteneur.ARRIVE,
      EtapeConteneur.DEPOTAGE_EN_COURS,
      EtapeConteneur.VERIFIER,
    ];

    const activeMontageSteps: EtapeMontage[] = [
      EtapeMontage.CREATION,
      EtapeMontage.VALIDE,
      EtapeMontage.EXECUTION,
      EtapeMontage.VERIFICATION,
      EtapeMontage.CORRECTION,
    ];

    const [
      conteneursCharges,
      conteneursTransit,
      conteneursArrives,
      totalCommandes,
      agendaToday,
      montagesActifs,
      commandesDisponibles,
      commandesVendues,
    ] = await Promise.all([
      prisma.conteneur.count({ where: { etapeConteneur: EtapeConteneur.CHARGE } }),
      prisma.conteneur.count({ where: { etapeConteneur: { in: transitSteps } } }),
      prisma.conteneur.count({ where: { etapeConteneur: { in: arrivedSteps } } }),
      prisma.commande.count(),
      prisma.agenda.count({
        where: { date: { gte: startOfDay, lte: endOfDay } },
      }),
      prisma.montage.count({ where: { etapeMontage: { in: activeMontageSteps } } }),
      prisma.commande.count({ where: { commandeFlag: "DISPONIBLE" } }),
      prisma.commande.count({ where: { commandeFlag: "VENDUE" } }),
    ]);

    return {
      success: true,
      data: {
        conteneursCharges,
        conteneursTransit,
        conteneursArrives,
        totalCommandes,
        agendaToday,
        montagesActifs,
        commandesDisponibles,
        commandesVendues,
      },
    };
  } catch (error) {
    console.error("Error fetching manager dashboard:", error);
    return { success: false, error: "Échec du chargement du tableau de bord" };
  }
}
