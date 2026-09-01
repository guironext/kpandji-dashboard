import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StatutReparation, type Prisma } from "@prisma/client";
import {
  setVoitureSavStatutSql,
  withVoitureSavStatut,
} from "@/lib/sav/voitureSavStatutSql";
import {
  isDeplacementSAV,
  setVoitureSavDeplacementSql,
} from "@/lib/sav/voitureSavDeplacementSql";
import {
  isStatutGarantieSAV,
  setVoitureSavStatutGarantieSql,
  withVoitureSavStatutGarantie,
} from "@/lib/sav/voitureSavStatutGarantieSql";

export const dynamic = "force-dynamic";

const STATUTS_VOITURE_SAV: string[] = [
  "ARRIVE",
  "DIAGNOSTIC_FINI",
  "PREPARATION_FINI",
  "DISPATCHE",
  "FIN_INTERVENTION_GARANTIESAV_EN_COURS",
  "GARANTIESAV_EN_COURS",
  "GARANTIESAV_TERMINE",
  "EN_TRAITEMENT",
  "EN_TRAITEMENT_EN_COURS",
  "EN_TRAITEMENT_FINI",
  "EN_MAINTENANCE",
  "EN_MAINTENANCE_EN_ATTENTE",
  "EN_MAINTENANCE_EN_COURS",
  "EN_MAINTENANCE_FINI",
  "TESTE",
  "TESTE_EN_COURS",
  "TESTE_FINAL",
  "TERMINE",
  "ANNULE",
];

function isPrismaP2032(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2032"
  );
}

function normalizeChassis(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

async function findGarantieByChassis(chassisNumber: string | null) {
  if (!chassisNumber) return null;
  return prisma.voitureSavGarantie.findFirst({
    where: {
      chassisNumber: { equals: chassisNumber, mode: "insensitive" },
    },
  });
}

/** Some VoitureSAV rows have null chassisNumber; skip the column if Prisma rejects it. */
async function findVoitureSavById(
  id: string,
  extra: Omit<Prisma.VoitureSAVFindUniqueArgs, "where"> = {},
) {
  const args = { ...extra, where: { id } } as Prisma.VoitureSAVFindUniqueArgs;
  const omit = {
    ...(typeof args.omit === "object" && args.omit ? args.omit : {}),
    statut: true as const,
    StatutGarantie: true as const,
  };
  const query = { ...args, omit };
  try {
    const row = await prisma.voitureSAV.findUnique(query);
    if (!row) return null;
    const [withStatut] = await withVoitureSavStatut([row]);
    const [withGarantie] = await withVoitureSavStatutGarantie([withStatut]);
    return withGarantie;
  } catch (error) {
    if (!isPrismaP2032(error)) throw error;
    const row = await prisma.voitureSAV.findUnique({
      ...query,
      omit: { ...omit, chassisNumber: true },
    });
    if (!row) return null;
    const [withStatut] = await withVoitureSavStatut([row]);
    const [withGarantie] = await withVoitureSavStatutGarantie([withStatut]);
    return withGarantie;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const voitureSAV = await findVoitureSavById(id, {
      include: {
        ClientSAV: true,
        Voiture: true,
        diagnosticArrivee: {
          orderBy: { createdAt: "asc" as const },
          include: {
            catergorieDiagnostic: true,
            DetailDiagnostic: { orderBy: { createdAt: "asc" as const } },
          },
        },
        GarantieSAV: {
          orderBy: { createdAt: "desc" as const },
          include: { groupePersonnelSAV: true },
        },
      },
    });
    if (!voitureSAV) {
      return NextResponse.json(
        { success: false, error: "Véhicule non trouvé" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: voitureSAV });
  } catch (error) {
    console.error("API getVoitureSAV by id error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors du chargement",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      model,
      motorisation,
      transmission,
      couleur,
      nbr_portes,
      immatriculation,
      chassisNumber: chassisNumberRaw,
      clientSAVId,
      statut,
      StatutGarantie,
      deplacementSAV,
    } = body;

    const voitureSAV = await findVoitureSavById(id, {
      include: { Voiture: true },
    });
    if (!voitureSAV) {
      return NextResponse.json(
        { success: false, error: "Véhicule non trouvé" },
        { status: 404 }
      );
    }

    if (
      statut !== undefined &&
      !STATUTS_VOITURE_SAV.includes(statut as string)
    ) {
      return NextResponse.json(
        { success: false, error: "Statut invalide" },
        { status: 400 }
      );
    }

    if (
      StatutGarantie !== undefined &&
      (typeof StatutGarantie !== "string" || !isStatutGarantieSAV(StatutGarantie))
    ) {
      return NextResponse.json(
        { success: false, error: "Statut garantie invalide" },
        { status: 400 }
      );
    }

    if (
      deplacementSAV !== undefined &&
      (typeof deplacementSAV !== "string" || !isDeplacementSAV(deplacementSAV))
    ) {
      return NextResponse.json(
        { success: false, error: "Déplacement invalide" },
        { status: 400 }
      );
    }

    const updateVoitureSAV: Record<string, unknown> = {};
    if (model !== undefined) updateVoitureSAV.model = model;
    if (motorisation !== undefined) updateVoitureSAV.motorisation = motorisation;
    if (transmission !== undefined) updateVoitureSAV.transmission = transmission;
    if (couleur !== undefined) updateVoitureSAV.couleur = couleur;
    if (nbr_portes !== undefined) updateVoitureSAV.nbr_portes = nbr_portes;
    if (immatriculation !== undefined) updateVoitureSAV.immatriculation = immatriculation;
    let nextStatutGarantie: string | undefined;
    if (chassisNumberRaw !== undefined) {
      const chassisNumber = normalizeChassis(chassisNumberRaw) ?? null;
      updateVoitureSAV.chassisNumber = chassisNumber;
      const garantie = await findGarantieByChassis(chassisNumber);
      updateVoitureSAV.voitureSavGarantieId = garantie?.id ?? null;
      if (StatutGarantie === undefined) {
        if (!garantie) {
          nextStatutGarantie = "PAS_DE_GARANTIE";
        } else if (voitureSAV.StatutGarantie === "PAS_DE_GARANTIE") {
          nextStatutGarantie = "EN_COURS";
        }
      }
    }
    if (clientSAVId !== undefined) updateVoitureSAV.clientSAVId = clientSAVId;
    if (typeof StatutGarantie === "string") nextStatutGarantie = StatutGarantie;

    const updateVoiture: Record<string, unknown> = {};
    if (nbr_portes !== undefined) updateVoiture.nbr_portes = nbr_portes;
    if (transmission !== undefined) updateVoiture.transmission = transmission;
    if (motorisation !== undefined) updateVoiture.motorisation = motorisation;
    if (couleur !== undefined) updateVoiture.couleur = couleur;
    updateVoiture.updatedAt = new Date();

    if (typeof statut === "string") {
      await setVoitureSavStatutSql(id, statut);
      if (statut === "TESTE" || statut === "TESTE_EN_COURS") {
        await prisma.reparation.updateMany({
          where: {
            voitureSAVId: id,
            statut: {
              in: [
                StatutReparation.EN_ATTENTE,
                StatutReparation.EN_TRAITEMENT,
                StatutReparation.EN_MAINTENANCE,
              ],
            },
          },
          data: { statut: StatutReparation.TESTE },
        });
      }
    }
    if (typeof deplacementSAV === "string") {
      await setVoitureSavDeplacementSql(id, deplacementSAV);
    }
    if (typeof nextStatutGarantie === "string") {
      await setVoitureSavStatutGarantieSql(id, nextStatutGarantie);
    }

    const voitureUpdates: Prisma.VoitureSAVUpdateInput = updateVoitureSAV;
    if (Object.keys(updateVoitureSAV).length > 0) {
      await prisma.$transaction([
        prisma.voitureSAV.update({
          where: { id },
          data: voitureUpdates,
        }),
        prisma.voiture.update({
          where: { id: voitureSAV.voitureId },
          data: updateVoiture,
        }),
      ]);
    } else {
      await prisma.voiture.update({
        where: { id: voitureSAV.voitureId },
        data: updateVoiture,
      });
    }

    const updated = await findVoitureSavById(id, {
      include: { ClientSAV: true, Voiture: true, VoitureSavGarantie: true },
    });
    const garantieRelation =
      updated && "VoitureSavGarantie" in updated
        ? (
            updated as {
              VoitureSavGarantie?: {
                garantieSAVbadge?: boolean | null;
              } | null;
            }
          ).VoitureSavGarantie
        : null;
    return NextResponse.json({
      success: true,
      data: updated
        ? {
            ...updated,
            sousGarantie: Boolean(
              garantieRelation && garantieRelation.garantieSAVbadge !== false,
            ),
          }
        : updated,
    });
  } catch (error) {
    console.error("API updateVoitureSAV error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors de la mise à jour",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const voitureSAV = await findVoitureSavById(id);
    if (!voitureSAV) {
      return NextResponse.json(
        { success: false, error: "Véhicule non trouvé" },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.voitureSAV.delete({ where: { id } }),
      prisma.voiture.delete({ where: { id: voitureSAV.voitureId } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API deleteVoitureSAV error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors de la suppression",
      },
      { status: 500 }
    );
  }
}
