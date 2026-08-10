"use server";

import { prisma } from "../prisma";
import { getOrCreateUser } from "./user";
import { currentUser } from "@clerk/nextjs/server";

export type RhDashboardStats = {
  employeesTotal: number;
  employeesActive: number;
  pointagesToday: number;
  pointagesStillAtWork: number;
  courriersByUser: number;
  unreadMessages: number;
  rapportEquipesCount: number;
  rapportMontagesCount: number;
};

export type RecentPointage = {
  id: string;
  nom: string;
  prenoms: string;
  heure_entree: string;
  heure_sortie: string;
  hasSortie: boolean;
};

export type RecentCourrier = {
  id: string;
  destinataire: string;
  objet: string;
  numero_courrier: string;
  date: string;
};

export type RhDashboardData = {
  stats: RhDashboardStats;
  recentPointages: RecentPointage[];
  recentCourriers: RecentCourrier[];
};

export async function getRhDashboardData(): Promise<{
  success: boolean;
  data?: RhDashboardData;
  error?: string;
}> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return { success: false, error: "Non authentifié" };
    }

    const userResult = await getOrCreateUser(clerkUser.id);
    if (!userResult.success || !userResult.data) {
      return { success: false, error: userResult.error || "Utilisateur non trouvé" };
    }
    const userId = userResult.data.id;

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const [
      employeesTotal,
      employeesActive,
      pointagesTodayRaw,
      courriersByUser,
      messagesUnread,
      rapportEquipesCount,
      rapportMontagesCount,
      recentPointagesRaw,
      recentCourriersRaw,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: "ACTIVE" } }),
      prisma.pointage.findMany({
        where: { date: { gte: startOfDay, lte: endOfDay } },
        include: {
          Employee: { select: { nom: true, prenoms: true } },
        },
        orderBy: { heure_entree: "desc" },
        take: 50,
      }),
      prisma.numeroCourrier.count({ where: { userId } }),
      prisma.message.count({
        where: {
          receiverId: userId,
          readAt: null,
        },
      }),
      prisma.rapportEquipe.count(),
      prisma.rapportMontage.count(),
      prisma.pointage.findMany({
        where: { date: { gte: startOfDay, lte: endOfDay } },
        include: {
          Employee: { select: { nom: true, prenoms: true } },
        },
        orderBy: { heure_entree: "desc" },
        take: 10,
      }),
      prisma.numeroCourrier.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const pointagesStillAtWork = pointagesTodayRaw.filter((p) => {
      const entry = p.heure_entree.getTime();
      const exit = p.heure_sortie?.getTime() ?? entry;
      return exit <= entry;
    }).length;

    const recentPointages: RecentPointage[] = recentPointagesRaw.map((p) => {
      const hasSortie = (p.heure_sortie?.getTime() ?? 0) > p.heure_entree.getTime();
      return {
        id: p.id,
        nom: p.Employee.nom,
        prenoms: p.Employee.prenoms,
        heure_entree: p.heure_entree.toISOString(),
        heure_sortie: p.heure_sortie?.toISOString() ?? p.heure_entree.toISOString(),
        hasSortie,
      };
    });

    const recentCourriers: RecentCourrier[] = recentCourriersRaw.map((c) => ({
      id: c.id,
      destinataire: c.destinataire,
      objet: c.objet,
      numero_courrier: c.numero_courrier,
      date: c.date.toISOString(),
    }));

    const stats: RhDashboardStats = {
      employeesTotal,
      employeesActive,
      pointagesToday: pointagesTodayRaw.length,
      pointagesStillAtWork,
      courriersByUser,
      unreadMessages: messagesUnread,
      rapportEquipesCount,
      rapportMontagesCount,
    };

    return {
      success: true,
      data: {
        stats,
        recentPointages,
        recentCourriers,
      },
    };
  } catch (error) {
    console.error("Error fetching RH dashboard:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors du chargement",
    };
  }
}
