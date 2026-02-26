import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/actions/user";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    let clerkId = (await auth()).userId;
    const clerkUserIdParam =
      request.nextUrl.searchParams.get("userId") ||
      request.nextUrl.searchParams.get("clerkUserId");
    if (!clerkId && clerkUserIdParam) {
      clerkId = clerkUserIdParam;
    }
    if (!clerkId) {
      return NextResponse.json(
        {
          success: false,
          error: "Non autorisé. Veuillez vous reconnecter.",
        },
        { status: 401 }
      );
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: "Utilisateur introuvable.",
        },
        { status: 401 }
      );
    }
    const userId = userResult.data.id;
    const fetchAll =
      request.nextUrl.searchParams.get("all") === "true" ||
      request.nextUrl.searchParams.get("all") === "1";
    const canFetchAll =
      userResult.data.role === "RESPONSABLE_COMMERCIAL" ||
      userResult.data.role === "ADMIN";

    if (fetchAll && canFetchAll) {
      const reservations = await prisma.reservationVehicule.findMany({
        include: {
          RendezVous: {
            select: {
              id: true,
              date: true,
              statut: true,
              resume_rendez_vous: true,
              client: { select: { nom: true } },
              Client_entreprise: { select: { nom_entreprise: true } },
            },
          },
          User: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { dateReservation: "desc" },
      });

      return NextResponse.json({
        success: true,
        data: reservations,
      });
    }

    const reservations = await prisma.reservationVehicule.findMany({
      where: { userId },
      include: {
        RendezVous: {
          select: {
            id: true,
            date: true,
            statut: true,
            resume_rendez_vous: true,
            client: { select: { nom: true } },
            Client_entreprise: { select: { nom_entreprise: true } },
          },
        },
      },
      orderBy: { dateReservation: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: reservations,
    });
  } catch (error) {
    console.error("Error fetching reservation vehicule:", error);
    const msg =
      error instanceof Error ? error.message : "Erreur lors du chargement";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Corps de requête invalide" },
        { status: 400 }
      );
    }

    let clerkId = (await auth()).userId;
    // Fallback: use clerkUserId from body when auth() returns null (e.g. fetch from client)
    if (!clerkId && (body as { clerkUserId?: string }).clerkUserId) {
      clerkId = (body as { clerkUserId: string }).clerkUserId;
    }
    if (!clerkId) {
      return NextResponse.json(
        {
          success: false,
          error: "Non autorisé. Veuillez vous reconnecter et réessayer.",
        },
        { status: 401 }
      );
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: "Utilisateur introuvable. Vérifiez que vous êtes bien enregistré.",
        },
        { status: 401 }
      );
    }
    const userId = userResult.data.id;

    const {
      rendezVousId,
      inopine,
      moyenTransport,
      dateReservation,
      dateRetour,
      heure_reserve,
      destination,
      motif,
      commentaire,
      clientOuEntrepriseNom,
    } = body as {
      rendezVousId?: string;
      inopine?: boolean;
      moyenTransport?: string;
      dateReservation?: string;
      dateRetour?: string;
      heure_reserve?: string;
      destination?: string;
      motif?: string;
      commentaire?: string;
      clientOuEntrepriseNom?: string;
    };

    if (
      !moyenTransport ||
      !dateReservation ||
      !dateRetour ||
      !heure_reserve ||
      !destination ||
      !motif
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "moyenTransport, dateReservation, dateRetour, heure_reserve, destination et motif sont requis",
        },
        { status: 400 }
      );
    }

    if (!inopine && !rendezVousId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "rendezVousId est requis pour une réservation liée à un rendez-vous. Utilisez inopine: true pour un rendez-vous inopiné.",
        },
        { status: 400 }
      );
    }

    const dateReservationDate = new Date(dateReservation);
    const dateRetourDate = new Date(dateRetour);

    let finalRendezVousId = rendezVousId;

    if (inopine) {
      const [hourPart, minPart] = heure_reserve.trim().split(":");
      const rdvDate = new Date(dateReservation);
      if (hourPart !== undefined && minPart !== undefined) {
        rdvDate.setHours(parseInt(hourPart, 10), parseInt(minPart, 10), 0, 0);
      }
      const rendezVousInopine = await prisma.rendezVous.create({
        data: {
          id: crypto.randomUUID(),
          date: rdvDate,
          statut: "EN_ATTENTE",
          resume_rendez_vous: "Rendez-vous inopiné",
          updatedAt: new Date(),
        },
      });
      finalRendezVousId = rendezVousInopine.id;
    }

    const calendrierSortie = await prisma.calendrierSortie.create({
      data: {
        dateSortie: dateReservationDate,
        dateRetour: dateRetourDate,
        destination: destination.trim(),
        motif: motif.trim(),
        commentaire: commentaire?.trim() || null,
        userId,
        autre_moyen_transport: moyenTransport.trim(),
        rendezVousId: finalRendezVousId,
      } as unknown as Prisma.CalendrierSortieUncheckedCreateInput,
    });

    // Use raw insert until Prisma client is regenerated (run: npx prisma generate)
    const id = crypto.randomUUID();
    const now = new Date();
    await prisma.$executeRaw`
      INSERT INTO "ReservationVehicule" (
        id, "dateReservation", "dateRetour", "heure_reserve", destination, motif, commentaire,
        "rendezVousId", "moyenTransport", "clientOuEntrepriseNom", "userId", "calendrierSortieId",
        "createdAt", "updatedAt", statut
      ) VALUES (
        ${id}, ${dateReservationDate}, ${dateRetourDate}, ${heure_reserve.trim()}, ${destination.trim()},
        ${motif.trim()}, ${commentaire?.trim() || null}, ${finalRendezVousId}, ${moyenTransport.trim()},
        ${clientOuEntrepriseNom?.trim() || null}, ${userId}, ${calendrierSortie.id}, ${now}, ${now}, 'EN_ATTENTE'
      )
    `;

    try {
      revalidatePath("/commercial/rendez-vous");
      revalidatePath("/commercial/calendrier-sortie");
      revalidatePath("/commercial/reservation-vehicule");
      revalidatePath("/responsablecommercial/calendrier-sortie");
    } catch {
      // Ignore revalidate errors
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating reservation vehicule:", error);
    const msg =
      error instanceof Error ? error.message : "Erreur lors de la création";
    const isDbError =
      msg.includes("P1001") ||
      msg.includes("Can't reach") ||
      msg.includes("P2003") ||
      msg.includes("foreign key");
    return NextResponse.json(
      {
        success: false,
        error: isDbError
          ? "Base de données inaccessible ou référence invalide. Vérifiez votre connexion."
          : msg,
      },
      { status: 500 }
    );
  }
}
