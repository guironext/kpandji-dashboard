import { NextRequest, NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import { StatutMaintenance, StatusFacture } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildLineRowsFactureTerminee,
  roundMoney,
  totalHtFromLines,
  TVA_RATE_SAV,
  type ReparationRow,
} from "@/lib/sav/savFactureLines";

export const dynamic = "force-dynamic";

function toDecimal(v: unknown): Decimal | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return new Decimal(n);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const maintenanceId = typeof body?.maintenanceId === "string" ? body.maintenanceId.trim() : "";
    if (!maintenanceId) {
      return NextResponse.json(
        { success: false, error: "maintenanceId requis" },
        { status: 400 },
      );
    }

    const m = await prisma.maintenance.findUnique({
      where: { id: maintenanceId },
      include: {
        reparation: {
          include: {
            voitureSAV: { include: { ClientSAV: true } },
            DetailDiagnostic: {
              orderBy: { createdAt: "asc" },
              include: { catergorieDiagnostic: true },
            },
            PieceSAV: true,
          },
        },
      },
    });

    if (!m?.reparation) {
      return NextResponse.json(
        { success: false, error: "Maintenance ou réparation introuvable" },
        { status: 404 },
      );
    }

    if (m.statut !== StatutMaintenance.TERMINEE) {
      return NextResponse.json(
        {
          success: false,
          error: "La maintenance doit être terminée pour établir la facture",
        },
        { status: 400 },
      );
    }

    const rep = m.reparation;

    const existingFact = await prisma.factureProformaSAV.findFirst({
      where: { reparationId: rep.id },
    });
    if (existingFact) {
      return NextResponse.json(
        {
          success: false,
          error: "Une facture existe déjà pour cette réparation",
          data: existingFact,
        },
        { status: 409 },
      );
    }

    const maintenancesTerminees = await prisma.maintenance.findMany({
      where: {
        reparationId: rep.id,
        statut: StatutMaintenance.TERMINEE,
      },
    });

    const lines = buildLineRowsFactureTerminee(
      rep as unknown as ReparationRow,
      maintenancesTerminees,
    );
    const totalHt = totalHtFromLines(lines);
    const montantTva = roundMoney(totalHt * (TVA_RATE_SAV / 100));
    const totalTtc = roundMoney(totalHt + montantTva);

    const prixPu = m.prix_maintenance != null ? toDecimal(m.prix_maintenance) : null;
    const dureeStr = m.duree_maintenance?.trim() || null;

    const numero = `FAC-SAV-${m.id.slice(0, 8).toUpperCase()}`;

    const facture = await prisma.$transaction(async (tx) => {
      await tx.reparation.update({
        where: { id: rep.id },
        data: {
          horaire_travail_prix: prixPu,
          horaire_travail_duration: dureeStr,
        },
      });

      return tx.factureProformaSAV.create({
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
          reparationId: rep.id,
          maintenanceId: m.id,
        },
      });
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
