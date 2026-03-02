import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/actions/user";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function getAuthUser(
  body?: { clerkUserId?: string } | null,
  url?: URL
) {
  let clerkId = (await auth()).userId;
  if (!clerkId && body?.clerkUserId) clerkId = body.clerkUserId;
  if (!clerkId && url) {
    clerkId =
      url.searchParams.get("userId") || url.searchParams.get("clerkUserId");
  }
  if (!clerkId) return null;
  const userResult = await getOrCreateUser(clerkId);
  if (!userResult.success || !userResult.data) return null;
  return userResult.data;
}

const canManageAll =
  (role: string) =>
    role === "RESPONSABLE_COMMERCIAL" || role === "ADMIN";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const authUser = await getAuthUser(body, request.nextUrl);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Non autorisé." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const whereClause = canManageAll(authUser.role)
      ? { id }
      : { id, userId: authUser.id };
    const existing = await prisma.reservationVehicule.findFirst({
      where: whereClause,
      include: { CalendrierSortie: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Réservation introuvable." },
        { status: 404 }
      );
    }

    const {
      moyenTransport,
      dateReservation,
      dateRetour,
      heure_reserve,
      destination,
      motif,
      commentaire,
      clientOuEntrepriseNom,
      statut,
      accompagnant,
      coutTransport,
    } = body as {
      moyenTransport?: string;
      dateReservation?: string;
      dateRetour?: string;
      heure_reserve?: string;
      destination?: string;
      motif?: string;
      commentaire?: string;
      clientOuEntrepriseNom?: string;
      statut?: string;
      accompagnant?: string;
      coutTransport?: number | string;
    };

    const dateReservationDate = dateReservation
      ? new Date(dateReservation)
      : existing.dateReservation;
    const dateRetourDate = dateRetour
      ? new Date(dateRetour)
      : existing.dateRetour;
    const dest = destination?.trim() ?? existing.destination;
    const mot = motif?.trim() ?? existing.motif;
    const comm = commentaire !== undefined ? commentaire?.trim() || null : existing.commentaire;
    const transport = moyenTransport?.trim() ?? existing.moyenTransport ?? "";
    const clientNom =
      clientOuEntrepriseNom !== undefined
        ? clientOuEntrepriseNom?.trim() || null
        : existing.clientOuEntrepriseNom;
    const heure = heure_reserve?.trim() ?? existing.heure_reserve;
    const accomp = accompagnant !== undefined ? accompagnant?.trim() || null : existing.accompagnant;
    const cout = coutTransport !== undefined
      ? (typeof coutTransport === "number" ? coutTransport : parseFloat(String(coutTransport)) || 0)
      : (existing.coutTransport ? Number(existing.coutTransport) : 0);

    await prisma.$transaction([
      prisma.reservationVehicule.update({
        where: { id },
        data: {
          dateReservation: dateReservationDate,
          dateRetour: dateRetourDate,
          heure_reserve: heure,
          destination: dest,
          motif: mot,
          commentaire: comm,
          moyenTransport: transport,
          clientOuEntrepriseNom: clientNom,
          accompagnant: accomp,
          coutTransport: cout,
          ...(statut && { statut: statut as "EN_ATTENTE" | "CONFIRME" | "ANNULE" | "DEPLACE" | "EFFECTUE" | "EN_COURS" | "TERMINEE" }),
          updatedAt: new Date(),
        },
      }),
      prisma.calendrierSortie.update({
        where: { id: existing.calendrierSortieId },
        data: {
          dateSortie: dateReservationDate,
          dateRetour: dateRetourDate,
          destination: dest,
          motif: mot,
          commentaire: comm,
          autre_moyen_transport: transport,
          moyenTransport: transport,
          updatedAt: new Date(),
        },
      }),
    ]);

    try {
      revalidatePath("/commercial/rendez-vous");
      revalidatePath("/commercial/calendrier-sortie");
      revalidatePath("/commercial/reservation-vehicule");
      revalidatePath("/responsablecommercial/reservation-vehicule");
      revalidatePath("/responsablecommercial/calendrier-sortie");
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating reservation vehicule:", error);
    const msg =
      error instanceof Error ? error.message : "Erreur lors de la mise à jour";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(null, request.nextUrl);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Non autorisé." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const whereClause = canManageAll(authUser.role)
      ? { id }
      : { id, userId: authUser.id };
    const existing = await prisma.reservationVehicule.findFirst({
      where: whereClause,
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Réservation introuvable." },
        { status: 404 }
      );
    }

    await prisma.reservationVehicule.delete({
      where: { id },
    });

    try {
      revalidatePath("/commercial/rendez-vous");
      revalidatePath("/commercial/calendrier-sortie");
      revalidatePath("/commercial/reservation-vehicule");
      revalidatePath("/responsablecommercial/reservation-vehicule");
      revalidatePath("/responsablecommercial/calendrier-sortie");
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting reservation vehicule:", error);
    const msg =
      error instanceof Error ? error.message : "Erreur lors de la suppression";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
