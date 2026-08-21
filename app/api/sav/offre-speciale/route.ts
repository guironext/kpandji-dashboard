import { NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Vehicles eligible for special warranty offers + existing garanties */
export async function GET() {
  try {
    const [voitures, garanties, groupes] = await Promise.all([
      prisma.voitureSAV.findMany({
        where: {
          statut: {
            in: [
              "DIAGNOSTIC_FINI",
              "DISPATCHE",
              "EN_TRAITEMENT",
              "GARANTIESAV_EN_COURS",
            ],
          },
        },
        include: {
          ClientSAV: true,
          diagnosticArrivee: {
            include: {
              catergorieDiagnostic: true,
              DetailDiagnostic: true,
            },
          },
          GarantieSAV: {
            orderBy: { createdAt: "desc" },
            include: { DetailDiagnostic: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.garantieSAV.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          voitureSAV: {
            include: { ClientSAV: true },
          },
          groupePersonnelSAV: { select: { id: true, nom: true } },
        },
      }),
      prisma.groupePersonnelSAV.findMany({
        orderBy: { nom: "asc" },
        select: { id: true, nom: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { voitures, garanties, groupes },
    });
  } catch (error) {
    console.error("API offre-speciale GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors du chargement",
      },
      { status: 500 },
    );
  }
}

/** Create a GarantieSAV (offre spéciale) for a vehicle */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const voitureSAVId =
      typeof body.voitureSAVId === "string" ? body.voitureSAVId.trim() : "";
    const categorie_garantie =
      typeof body.categorie_garantie === "string"
        ? body.categorie_garantie.trim()
        : "";
    const nom_garantie =
      typeof body.nom_garantie === "string" ? body.nom_garantie.trim() : "";
    const groupePersonnelSAVId =
      typeof body.groupePersonnelSAVId === "string"
        ? body.groupePersonnelSAVId.trim()
        : "";
    const detailDiagnosticIds = Array.isArray(body.detailDiagnosticIds)
      ? (body.detailDiagnosticIds as unknown[]).filter(
          (id): id is string => typeof id === "string" && id.length > 0,
        )
      : [];

    const quantite_garantie_offert =
      body.quantite_garantie_offert === null ||
      body.quantite_garantie_offert === undefined ||
      body.quantite_garantie_offert === ""
        ? null
        : Number(body.quantite_garantie_offert);
    const prix_unitaire =
      body.prix_unitaire === null ||
      body.prix_unitaire === undefined ||
      body.prix_unitaire === ""
        ? null
        : Number(body.prix_unitaire);

    if (!voitureSAVId || !categorie_garantie) {
      return NextResponse.json(
        {
          success: false,
          error: "voitureSAVId et categorie_garantie sont requis",
        },
        { status: 400 },
      );
    }

    const voiture = await prisma.voitureSAV.findUnique({
      where: { id: voitureSAVId },
      select: { id: true, statut: true },
    });
    if (!voiture) {
      return NextResponse.json(
        { success: false, error: "Véhicule introuvable" },
        { status: 404 },
      );
    }

    if (groupePersonnelSAVId) {
      const groupe = await prisma.groupePersonnelSAV.findUnique({
        where: { id: groupePersonnelSAVId },
        select: { id: true },
      });
      if (!groupe) {
        return NextResponse.json(
          { success: false, error: "Groupe personnel introuvable" },
          { status: 404 },
        );
      }
    }

    const garantie = await prisma.$transaction(async (tx) => {
      const created = await tx.garantieSAV.create({
        data: {
          categorie_garantie,
          nom_garantie: nom_garantie || null,
          quantite_garantie_offert:
            quantite_garantie_offert != null &&
            Number.isFinite(quantite_garantie_offert)
              ? Math.trunc(quantite_garantie_offert)
              : null,
          prix_unitaire:
            prix_unitaire != null && Number.isFinite(prix_unitaire)
              ? new Decimal(prix_unitaire)
              : null,
          statut: "EN_ATTENTE",
          voitureSAV: { connect: { id: voitureSAVId } },
          ...(groupePersonnelSAVId
            ? { groupePersonnelSAV: { connect: { id: groupePersonnelSAVId } } }
            : {}),
        },
      });

      if (detailDiagnosticIds.length > 0) {
        await tx.detailDiagnostic.updateMany({
          where: {
            id: { in: detailDiagnosticIds },
            garantieSAVId: null,
          },
          data: { garantieSAVId: created.id },
        });
      }

      if (
        voiture.statut === "DIAGNOSTIC_FINI" ||
        voiture.statut === "DISPATCHE" ||
        voiture.statut === "EN_TRAITEMENT"
      ) {
        await tx.voitureSAV.update({
          where: { id: voitureSAVId },
          data: { statut: "GARANTIESAV_EN_COURS" },
        });
      }

      return created;
    });

    return NextResponse.json({ success: true, data: garantie });
  } catch (error) {
    console.error("API offre-speciale POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la création de l'offre",
      },
      { status: 500 },
    );
  }
}

/** Return a warranty vehicle to dispatching (statut DIAGNOSTIC_FINI). */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const action = typeof body.action === "string" ? body.action.trim() : "";
    const voitureSAVId =
      typeof body.voitureSAVId === "string" ? body.voitureSAVId.trim() : "";

    if (!voitureSAVId || (action !== "retour" && action !== "assign-groupe")) {
      return NextResponse.json(
        {
          success: false,
          error: "action (« retour » ou « assign-groupe ») et voitureSAVId sont requis",
        },
        { status: 400 },
      );
    }

    if (action === "assign-groupe") {
      const groupePersonnelSAVId =
        typeof body.groupePersonnelSAVId === "string"
          ? body.groupePersonnelSAVId.trim()
          : "";
      if (!groupePersonnelSAVId) {
        return NextResponse.json(
          { success: false, error: "groupePersonnelSAVId est requis" },
          { status: 400 },
        );
      }

      const groupe = await prisma.groupePersonnelSAV.findUnique({
        where: { id: groupePersonnelSAVId },
        select: { id: true, nom: true },
      });
      if (!groupe) {
        return NextResponse.json(
          { success: false, error: "Groupe personnel introuvable" },
          { status: 404 },
        );
      }

      const voiture = await prisma.voitureSAV.findUnique({
        where: { id: voitureSAVId },
        include: {
          GarantieSAV: { orderBy: { createdAt: "desc" } },
        },
      });
      if (!voiture) {
        return NextResponse.json(
          { success: false, error: "Véhicule introuvable" },
          { status: 404 },
        );
      }

      const active = voiture.GarantieSAV.find((g) => g.statut !== "ANNULE");
      const garantie = active
        ? await prisma.garantieSAV.update({
            where: { id: active.id },
            data: { groupePersonnelSAVId: groupe.id },
            include: {
              groupePersonnelSAV: { select: { id: true, nom: true } },
            },
          })
        : await prisma.garantieSAV.create({
            data: {
              categorie_garantie: "Garantie SAV",
              statut: "EN_TRAITEMENT",
              voitureSAV: { connect: { id: voitureSAVId } },
              groupePersonnelSAV: { connect: { id: groupe.id } },
            },
            include: {
              groupePersonnelSAV: { select: { id: true, nom: true } },
            },
          });

      return NextResponse.json({
        success: true,
        data: { voitureSAVId, groupe, garantie },
      });
    }

    const voiture = await prisma.voitureSAV.findUnique({
      where: { id: voitureSAVId },
      select: { id: true, statut: true },
    });
    if (!voiture) {
      return NextResponse.json(
        { success: false, error: "Véhicule introuvable" },
        { status: 404 },
      );
    }

    if (
      voiture.statut !== "GARANTIESAV_EN_COURS" &&
      voiture.statut !== "GARANTIESAV_TERMINE"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Seuls les véhicules en garantie peuvent retourner au dispatching",
        },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      const garanties = await tx.garantieSAV.findMany({
        where: { voitureSAVId },
        select: { id: true },
      });
      const garantieIds = garanties.map((g) => g.id);
      if (garantieIds.length > 0) {
        await tx.detailDiagnostic.updateMany({
          where: { garantieSAVId: { in: garantieIds } },
          data: { garantieSAVId: null },
        });
        await tx.garantieSAV.updateMany({
          where: { id: { in: garantieIds } },
          data: { statut: "ANNULE" },
        });
      }
      await tx.voitureSAV.update({
        where: { id: voitureSAVId },
        data: { statut: "DIAGNOSTIC_FINI" },
      });
    });

    return NextResponse.json({
      success: true,
      data: { voitureSAVId, statut: "DIAGNOSTIC_FINI" },
    });
  } catch (error) {
    console.error("API offre-speciale PATCH error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors du retour au dispatching",
      },
      { status: 500 },
    );
  }
}
