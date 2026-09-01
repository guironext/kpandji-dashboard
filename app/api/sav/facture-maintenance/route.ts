import { NextRequest, NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import { StatutMaintenance, StatusFacture } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fetchVoitureSavStatuts } from "@/lib/sav/voitureSavStatutSql";
import {
  buildLineRowsFactureTerminee,
  mergeVoitureSavReparationsForFacture,
  roundMoney,
  totalHtFromLines,
  TVA_RATE_SAV,
  type ReparationRow,
} from "@/lib/sav/savFactureLines";

export const dynamic = "force-dynamic";

const reparationFactureInclude = {
  DetailDiagnostic: {
    orderBy: { createdAt: "asc" as const },
    include: { catergorieDiagnostic: true },
  },
  PieceSAV: true,
  Maintenance: {
    orderBy: { createdAt: "asc" as const },
    include: { catergorieDiagnostic: true },
  },
  FactureProformaSAV: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const voitureSAVId =
      typeof body?.voitureSAVId === "string" ? body.voitureSAVId.trim() : "";
    const maintenanceId =
      typeof body?.maintenanceId === "string" ? body.maintenanceId.trim() : "";

    if (!voitureSAVId && !maintenanceId) {
      return NextResponse.json(
        { success: false, error: "voitureSAVId requis" },
        { status: 400 },
      );
    }

    let resolvedVoitureId = voitureSAVId;

    if (!resolvedVoitureId && maintenanceId) {
      const m = await prisma.maintenance.findUnique({
        where: { id: maintenanceId },
        select: { reparation: { select: { voitureSAVId: true } } },
      });
      resolvedVoitureId = m?.reparation?.voitureSAVId ?? "";
    }

    if (!resolvedVoitureId) {
      return NextResponse.json(
        { success: false, error: "Véhicule introuvable" },
        { status: 404 },
      );
    }

    const voitureStatuts = await fetchVoitureSavStatuts([resolvedVoitureId]);
    if (voitureStatuts.get(resolvedVoitureId) !== "TERMINE") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Le véhicule doit être au statut « terminé » pour établir la facture",
        },
        { status: 400 },
      );
    }

    const vehicle = await prisma.voitureSAV.findUnique({
      where: { id: resolvedVoitureId },
      select: {
        id: true,
        model: true,
        immatriculation: true,
        couleur: true,
        motorisation: true,
        transmission: true,
        updatedAt: true,
        ClientSAV: true,
        Reparation: {
          orderBy: { createdAt: "asc" },
          include: reparationFactureInclude,
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: "Véhicule introuvable" },
        { status: 404 },
      );
    }

    const reparationIds = vehicle.Reparation.map((r) => r.id);
    if (reparationIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Aucune réparation sur ce véhicule pour établir la facture",
        },
        { status: 400 },
      );
    }

    const existingFact = await prisma.factureProformaSAV.findFirst({
      where: { reparationId: { in: reparationIds } },
    });
    if (existingFact) {
      return NextResponse.json(
        {
          success: false,
          error: "Une facture existe déjà pour ce véhicule",
          data: existingFact,
        },
        { status: 409 },
      );
    }

    const allMaints = vehicle.Reparation.flatMap((r) => r.Maintenance);
    const termineeMaints = allMaints.filter(
      (m) => m.statut === StatutMaintenance.TERMINEE,
    );
    const maintenance =
      (maintenanceId
        ? allMaints.find((m) => m.id === maintenanceId)
        : undefined) ??
      termineeMaints[0] ??
      allMaints[0];

    if (!maintenance) {
      return NextResponse.json(
        {
          success: false,
          error: "Aucune maintenance pour enregistrer la facture",
        },
        { status: 400 },
      );
    }

    const merged = mergeVoitureSavReparationsForFacture(vehicle);
    const lines = buildLineRowsFactureTerminee(
      merged as ReparationRow,
      merged.Maintenance,
    );
    const totalHt = totalHtFromLines(lines);
    const montantTva = roundMoney(totalHt * (TVA_RATE_SAV / 100));
    const totalTtc = roundMoney(totalHt + montantTva);

    const numero = `FAC-SAV-${resolvedVoitureId.slice(0, 8).toUpperCase()}`;

    const facture = await prisma.factureProformaSAV.create({
      data: {
        numero_facture: numero,
        date_facture: new Date(),
        montant_ht: new Decimal(totalHt),
        montant_net_ht: new Decimal(totalHt),
        remise: new Decimal(0),
        tva: new Decimal(TVA_RATE_SAV),
        montant_tva: new Decimal(montantTva),
        total_ttc: new Decimal(totalTtc),
        avance_payee: new Decimal(0),
        statut_facture: StatusFacture.FACTURE,
        reparationId: maintenance.reparationId,
        maintenanceId: maintenance.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        facture,
        montants: { totalHt, montantTva, totalTtc, tvaRate: TVA_RATE_SAV },
      },
    });
  } catch (error) {
    console.error("API facture-maintenance POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors de la création",
      },
      { status: 500 },
    );
  }
}
