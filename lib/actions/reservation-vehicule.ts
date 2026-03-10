"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "../prisma";
import { getOrCreateUser } from "./user";

export type ReservationVehiculeConfirmee = {
  id: string;
  destination: string;
  moyenTransport: string | null;
  coutTransport: number | null;
  User: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

export async function getReservationsVehiculeConfirmees() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { success: false, error: "Non autorisé. Veuillez vous reconnecter." };
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return { success: false, error: "Utilisateur introuvable." };
    }

    const canFetchAll =
      userResult.data.role === "RESPONSABLE_COMMERCIAL" ||
      userResult.data.role === "ADMIN";

    if (!canFetchAll) {
      return { success: false, error: "Accès non autorisé." };
    }

    const reservations = await prisma.reservationVehicule.findMany({
      where: { statut: "CONFIRME" },
      select: {
        id: true,
        destination: true,
        moyenTransport: true,
        coutTransport: true,
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { dateReservation: "desc" },
    });

    const data: ReservationVehiculeConfirmee[] = reservations.map((r) => ({
      id: r.id,
      destination: r.destination,
      moyenTransport: r.moyenTransport,
      coutTransport: r.coutTransport != null ? Number(r.coutTransport) : 0,
      User: r.User,
    }));

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching reservation vehicule confirmees:", error);
    const msg =
      error instanceof Error ? error.message : "Erreur lors du chargement";
    return { success: false, error: msg };
  }
}
