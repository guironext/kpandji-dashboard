import { NextResponse } from "next/server";
import { executeWithRetry, prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import type { StatutVoitureSAV, VoitureSavGarantie } from "@prisma/client";
import { withVoitureSavStatut, fetchVoitureSavIdsByStatut } from "@/lib/sav/voitureSavStatutSql";
import { listInterventionsOffertByVoitureIdsRaw } from "@/lib/interventionDiagnosticOffertSql";
import {
  fetchVoitureSavIdsByDeplacement,
  isDeplacementSAV,
  withVoitureSavDeplacement,
} from "@/lib/sav/voitureSavDeplacementSql";

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
  "TESTE",
  "TERMINE",
  "ANNULE",
];

function normalizeChassis(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

async function findGarantieByChassis(
  chassisNumber: string | null
): Promise<VoitureSavGarantie | null> {
  if (!chassisNumber) return null;
  return prisma.voitureSavGarantie.findFirst({
    where: {
      chassisNumber: { equals: chassisNumber, mode: "insensitive" },
    },
  });
}

function chassisKey(value: string | null | undefined) {
  return value?.trim().toLowerCase() || "";
}

function withGarantieMatch<T extends {
  chassisNumber?: string | null;
  VoitureSavGarantie?: VoitureSavGarantie | null;
}>(voiture: T, garanties: VoitureSavGarantie[]) {
  const linked = voiture.VoitureSavGarantie ?? null;
  const key = chassisKey(voiture.chassisNumber);
  const matched =
    linked ??
    (key
      ? garanties.find((g) => chassisKey(g.chassisNumber) === key) ?? null
      : null);
  return {
    ...voiture,
    VoitureSavGarantie: matched,
    sousGarantie: Boolean(matched && matched.garantieSAVbadge !== false),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statutParam = searchParams.get("statut");
    const deplacementParam = searchParams.get("deplacement");
    const includeDiagnostic = searchParams.get("includeDiagnostic") === "1";
    const includeGarantie = searchParams.get("includeGarantie") === "1";
    const includeInterventions = searchParams.get("includeInterventions") === "1";

    const emptyId = "00000000-0000-0000-0000-000000000000";
    let where:
      | { statut: StatutVoitureSAV }
      | { id: { in: string[] } }
      | undefined;
    const useSqlStatut =
      statutParam === "PREPARATION_FINI" ||
      statutParam === "EN_MAINTENANCE" ||
      statutParam === "EN_MAINTENANCE_EN_ATTENTE" ||
      statutParam === "EN_MAINTENANCE_EN_COURS" ||
      statutParam === "EN_TRAITEMENT_EN_COURS" ||
      statutParam === "FIN_INTERVENTION_GARANTIESAV_EN_COURS";
    if (
      statutParam &&
      (useSqlStatut ||
        STATUTS_VOITURE_SAV.includes(statutParam as StatutVoitureSAV))
    ) {
      if (useSqlStatut) {
        const ids = await fetchVoitureSavIdsByStatut(statutParam);
        where = {
          id: {
            in: ids.length > 0 ? ids : [emptyId],
          },
        };
      } else {
        where = { statut: statutParam as StatutVoitureSAV };
      }
    }

    if (deplacementParam && isDeplacementSAV(deplacementParam)) {
      const deplacementIds = await fetchVoitureSavIdsByDeplacement(
        deplacementParam
      );
      const deplacementSet = new Set(deplacementIds);
      if (where && "id" in where) {
        const intersected = where.id.in.filter((id) => deplacementSet.has(id));
        where = {
          id: { in: intersected.length > 0 ? intersected : [emptyId] },
        };
      } else if (where && "statut" in where) {
        const statutIds = await fetchVoitureSavIdsByStatut(where.statut);
        const intersected = statutIds.filter((id) => deplacementSet.has(id));
        where = {
          id: { in: intersected.length > 0 ? intersected : [emptyId] },
        };
      } else {
        where = {
          id: {
            in: deplacementIds.length > 0 ? deplacementIds : [emptyId],
          },
        };
      }
    }

    const include = {
      ClientSAV: true,
      Voiture: true,
      VoitureSavGarantie: true,
      ...(includeDiagnostic
        ? {
            diagnosticArrivee: {
              orderBy: { createdAt: "asc" as const },
              include: {
                catergorieDiagnostic: true,
                DetailDiagnostic: {
                  orderBy: { createdAt: "asc" as const },
                },
                PieceSAV: true,
              },
            },
          }
        : {}),
      ...(includeGarantie
        ? {
            GarantieSAV: {
              orderBy: { createdAt: "desc" as const },
              include: {
                groupePersonnelSAV: {
                  select: { id: true, nom: true },
                },
              },
            },
          }
        : {}),
    } as const;

    let voitures;
    try {
      voitures = await executeWithRetry(() =>
        prisma.voitureSAV.findMany({
          where,
          include,
          omit: { statut: true },
          orderBy: { createdAt: "desc" },
        })
      );
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? (error as { code?: string }).code
          : undefined;
      // Some rows have null chassisNumber while an older Prisma client still
      // typed the column as required. Skip the column so the list can load.
      if (code !== "P2032") throw error;
      voitures = await executeWithRetry(() =>
        prisma.voitureSAV.findMany({
          where,
          include,
          omit: { chassisNumber: true, statut: true },
          orderBy: { createdAt: "desc" },
        })
      );
    }
    voitures = await withVoitureSavStatut(voitures);
    voitures = await withVoitureSavDeplacement(voitures);
    const garanties = await executeWithRetry(() =>
      prisma.voitureSavGarantie.findMany()
    );
    const interventionsByVoiture = new Map<
      string,
      Awaited<ReturnType<typeof listInterventionsOffertByVoitureIdsRaw>>
    >();
    if (includeInterventions && voitures.length > 0) {
      const rows = await listInterventionsOffertByVoitureIdsRaw(
        voitures.map((v) => v.id)
      );
      for (const row of rows) {
        const list = interventionsByVoiture.get(row.voitureSAVId) ?? [];
        list.push(row);
        interventionsByVoiture.set(row.voitureSAVId, list);
      }
    }

    return NextResponse.json({
      success: true,
      data: voitures.map((v) =>
        withGarantieMatch(
          {
            ...v,
            chassisNumber:
              "chassisNumber" in v
                ? (v as { chassisNumber?: string | null }).chassisNumber
                : null,
            ...(includeInterventions
              ? {
                  InterventionDiagnosticOffert:
                    interventionsByVoiture.get(v.id) ?? [],
                }
              : {}),
          },
          garanties
        )
      ),
    });
  } catch (error) {
    console.error("API getVoitureSAV error:", error);
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { model, motorisation, transmission, couleur, nbr_portes, immatriculation, clientSAVId } = body;
    const chassisNumber = normalizeChassis(body.chassisNumber);

    if (!model || !motorisation || !transmission || !couleur || !nbr_portes || !immatriculation || !clientSAVId) {
      return NextResponse.json(
        {
          success: false,
          error: "Modèle, motorisation, transmission, couleur, nombre de portes, immatriculation et client sont requis",
        },
        { status: 400 }
      );
    }

    if (!chassisNumber) {
      return NextResponse.json(
        { success: false, error: "Le numéro de châssis est requis" },
        { status: 400 }
      );
    }

    const validMotorisations = ["ELECTRIQUE", "ESSENCE", "DIESEL", "HYBRIDE"];
    const validTransmissions = ["AUTOMATIQUE", "MANUEL"];
    if (
      !validMotorisations.includes(motorisation) ||
      !validTransmissions.includes(transmission)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Motorisation ou transmission invalide",
        },
        { status: 400 }
      );
    }

    const voitureId = randomUUID();
    const now = new Date();
    const garantie = await findGarantieByChassis(chassisNumber);

    const [voiture, voitureSAV] = await prisma.$transaction([
      prisma.voiture.create({
        data: {
          id: voitureId,
          nbr_portes,
          transmission,
          motorisation,
          couleur,
          updatedAt: now,
          etatVoiture: "PARKING",
        },
      }),
      prisma.voitureSAV.create({
        data: {
          model,
          motorisation,
          transmission,
          couleur,
          nbr_portes,
          immatriculation,
          chassisNumber,
          voitureSavGarantieId: garantie?.id ?? null,
          voitureId,
          clientSAVId,
        },
        include: {
          ClientSAV: true,
          VoitureSavGarantie: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...voitureSAV,
        Voiture: voiture,
        VoitureSavGarantie: garantie ?? voitureSAV.VoitureSavGarantie,
        sousGarantie: Boolean(garantie && garantie.garantieSAVbadge !== false),
      },
    });
  } catch (error) {
    console.error("API createVoitureSAV error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors de la création",
      },
      { status: 500 }
    );
  }
}
