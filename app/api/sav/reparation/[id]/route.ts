import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTerminerMaintenance } from "@/lib/sav/terminerMaintenanceValidation";
import { StatutMaintenance, StatutReparation } from "@prisma/client";

export const dynamic = "force-dynamic";

/** Données fraîches pour valider prix/durée avant de terminer la maintenance */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json(
        { success: false, error: "Identifiant reparation manquant" },
        { status: 400 }
      );
    }
    const repId = id.trim();
    const rep = await prisma.reparation.findUnique({
      where: { id: repId },
      select: {
        id: true,
        horaire_travail_prix: true,
        horaire_travail_duration: true,
        Maintenance: true,
        DetailDiagnostic: {
          select: { catergorieDiagnosticId: true },
        },
      },
    });
    if (!rep) {
      return NextResponse.json(
        { success: false, error: "Réparation introuvable" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: rep });
  } catch (error) {
    console.error("API reparation GET error:", error);
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
    if (!id?.trim()) {
      return NextResponse.json(
        { success: false, error: "Identifiant reparation manquant" },
        { status: 400 }
      );
    }
    const body = await request.json();
    const raw = body?.statut as string | undefined;
    if (
      raw !== StatutReparation.EN_MAINTENANCE &&
      raw !== StatutReparation.TERMINE
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Statut non pris en charge (EN_MAINTENANCE ou TERMINE uniquement)",
        },
        { status: 400 }
      );
    }
    const repId = id.trim();

    if (raw === StatutReparation.TERMINE) {
      const snapshot = await prisma.reparation.findUnique({
        where: { id: repId },
        select: {
          id: true,
          horaire_travail_prix: true,
          horaire_travail_duration: true,
          Maintenance: true,
          DetailDiagnostic: {
            select: { catergorieDiagnosticId: true },
          },
        },
      });
      if (!snapshot) {
        return NextResponse.json(
          { success: false, error: "Réparation introuvable" },
          { status: 404 }
        );
      }

      const check = validateTerminerMaintenance(
        snapshot,
        snapshot.Maintenance,
        snapshot.DetailDiagnostic.map((d) => d.catergorieDiagnosticId)
      );
      if (!check.ok) {
        return NextResponse.json(
          {
            success: false,
            error: `Impossible de terminer : ${check.error}`,
          },
          { status: 400 }
        );
      }

      const catIds = [
        ...new Set(
          snapshot.DetailDiagnostic.map((d) => d.catergorieDiagnosticId).filter(
            (cid): cid is string => cid != null && cid !== ""
          )
        ),
      ];

      if (catIds.length > 0) {
        await prisma.maintenance.updateMany({
          where: {
            reparationId: repId,
            catergorieDiagnosticId: { in: catIds },
          },
          data: { statut: StatutMaintenance.TERMINEE },
        });
      }
    }

    const updated = await prisma.reparation.update({
      where: { id: repId },
      data: { statut: raw },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";
    if (code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Réparation introuvable" },
        { status: 404 }
      );
    }
    console.error("API reparation PATCH error:", error);
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
