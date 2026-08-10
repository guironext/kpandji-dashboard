"use server";

import { prisma } from "../prisma";
import { getOrCreateUser } from "./user";

export type ActivityType = "project" | "message" | "courrier" | "plan_action";

export type CommunicationActivity = {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  date: Date;
  link?: string;
  metadata?: Record<string, unknown>;
};

export async function getCommunicationUserActivities(clerkId: string, limit = 30) {
  try {
    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return { success: false, error: userResult.error, data: [] };
    }
    const userId = userResult.data.id;

    const [projects, messages, courriers, planActions] = await Promise.all([
      // Projects created by user
      prisma.communicationProject.findMany({
        where: { createdById: userId },
        include: { createdBy: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      // Messages sent or received by user
      prisma.message.findMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }, { receiverId: null }],
        },
        include: {
          sender: { select: { firstName: true, lastName: true } },
          receiver: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      // NumeroCourrier created by user
      prisma.numeroCourrier.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      // Plan actions from projects created by user
      prisma.communicationPlanAction.findMany({
        where: {
          project: { createdById: userId },
        },
        include: {
          project: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
      }),
    ]);

    const activities: CommunicationActivity[] = [];

    for (const p of projects) {
      activities.push({
        id: `project-${p.id}`,
        type: "project",
        title: `Projet créé : ${p.name}`,
        description: `Statut : ${p.projectStatus}`,
        date: p.createdAt,
        link: `/communication/projets/${p.id}`,
        metadata: { projectStatus: p.projectStatus },
      });
    }

    for (const m of messages) {
      const isSent = m.senderId === userId;
      const otherUser = isSent ? m.receiver : m.sender;
      const otherName = otherUser
        ? `${otherUser.firstName} ${otherUser.lastName}`
        : "Tous";
      activities.push({
        id: `message-${m.id}`,
        type: "message",
        title: isSent ? `Message envoyé à ${otherName}` : `Message reçu de ${otherName}`,
        description: m.content.slice(0, 80) + (m.content.length > 80 ? "…" : ""),
        date: m.createdAt,
        link: "/communication/messages",
        metadata: { isSent },
      });
    }

    for (const c of courriers) {
      activities.push({
        id: `courrier-${c.id}`,
        type: "courrier",
        title: `Courrier créé : ${c.numero_courrier}`,
        description: `${c.destinataire} - ${c.objet}`,
        date: c.createdAt,
        link: "/communication/numero-courrier",
        metadata: { numero_courrier: c.numero_courrier },
      });
    }

    for (const a of planActions) {
      activities.push({
        id: `plan-${a.id}`,
        type: "plan_action",
        title: a.completed ? `Action terminée : ${a.title}` : `Action : ${a.title}`,
        description: `Projet : ${a.project.name}`,
        date: a.updatedAt,
        link: "/communication/mise-oeuvre",
        metadata: { completed: a.completed, projectId: a.projectId },
      });
    }

    // Sort by date descending
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      success: true,
      data: activities.slice(0, limit),
    };
  } catch (error) {
    console.error("Error fetching communication activities:", error);
    return { success: false, error: "Failed to fetch activities", data: [] };
  }
}

export async function getCommunicationUserStats(clerkId: string) {
  try {
    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return { success: false, error: userResult.error, data: null };
    }
    const userId = userResult.data.id;

    const [projectsCount, messagesCount, courriersCount, activeProjectsCount] =
      await Promise.all([
        prisma.communicationProject.count({ where: { createdById: userId } }),
        prisma.message.count({
          where: {
            OR: [{ senderId: userId }, { receiverId: userId }],
          },
        }),
        prisma.numeroCourrier.count({ where: { userId } }),
        prisma.communicationProject.count({
          where: { createdById: userId, projectStatus: "ACTIVE" },
        }),
      ]);

    return {
      success: true,
      data: {
        totalProjects: projectsCount,
        totalMessages: messagesCount,
        totalCourriers: courriersCount,
        activeProjects: activeProjectsCount,
      },
    };
  } catch (error) {
    console.error("Error fetching communication stats:", error);
    return { success: false, error: "Failed to fetch stats", data: null };
  }
}
